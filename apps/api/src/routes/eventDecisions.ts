import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  canUserSeeEvent,
  getRequestedAreaRoles,
  isSpecialtyRole,
  isUserResponsibleForEvent,
  normalizeAreaRole,
  type AreaDecisionRole,
} from "../lib/eventVisibility.js";

export const eventDecisionsRouter = Router({ mergeParams: true });

const AREA_LABELS: Record<AreaDecisionRole, string> = {
  PRODUCCION: "Producción",
  INSTITUCIONALES: "Institucionales",
  COBERTURA: "Cobertura",
};

async function loadDbUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, area: true, name: true },
  });
}

async function ensureDecisionRows(eventId: string, tipoEvento: string) {
  const requested = getRequestedAreaRoles(tipoEvento);
  for (const areaRole of requested) {
    await prisma.eventAreaDecision.upsert({
      where: { eventId_areaRole: { eventId, areaRole } },
      create: { eventId, areaRole, estado: "PENDING" },
      update: {},
    });
  }
  return requested;
}

/**
 * GET /events/:eventId/area-decisions
 * Checks de aprobación por área solicitada.
 */
eventDecisionsRouter.get("/:eventId/area-decisions", authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const dbUser = await loadDbUser(req.user!.id);
  if (!dbUser || !canUserSeeEvent(dbUser, event)) {
    res.status(403).json({ error: "No tenés permiso para ver este evento" });
    return;
  }

  const requested = await ensureDecisionRows(eventId, event.tipoEvento);
  const decisions = await prisma.eventAreaDecision.findMany({
    where: { eventId, areaRole: { in: requested } },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { areaRole: "asc" },
  });

  res.json({
    requested,
    decisions: decisions.map((d) => ({
      ...d,
      label: AREA_LABELS[d.areaRole as AreaDecisionRole] ?? d.areaRole,
    })),
    myAreaRole: normalizeAreaRole(dbUser.role),
    canDecide: isUserResponsibleForEvent(dbUser, event),
  });
});

/**
 * POST /events/:eventId/area-decisions
 * Body: { decision: "APPROVED" | "REJECTED", reason?: string }
 * Solo el rol de área solicitado puede marcar el check.
 */
eventDecisionsRouter.post("/:eventId/area-decisions", authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const { decision, reason } = req.body ?? {};
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    res.status(400).json({ error: "decision debe ser APPROVED o REJECTED" });
    return;
  }
  if (decision === "REJECTED" && (!reason || String(reason).trim() === "")) {
    res.status(400).json({ error: "Al rechazar es obligatorio indicar el motivo" });
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const dbUser = await loadDbUser(req.user!.id);
  if (!dbUser) {
    res.status(401).json({ error: "Usuario no encontrado" });
    return;
  }
  if (!isUserResponsibleForEvent(dbUser, event) && dbUser.role !== "ADMIN") {
    res.status(403).json({ error: "Solo el área solicitada puede aprobar o rechazar este evento" });
    return;
  }

  const areaRole =
    dbUser.role === "ADMIN"
      ? (normalizeAreaRole(String(req.body?.areaRole ?? "")) ?? getRequestedAreaRoles(event.tipoEvento)[0])
      : normalizeAreaRole(dbUser.role);

  if (!areaRole || !getRequestedAreaRoles(event.tipoEvento).includes(areaRole)) {
    res.status(400).json({ error: "No hay área aplicable para esta decisión" });
    return;
  }

  const reasonStr = reason != null ? String(reason).trim() : null;
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.eventAreaDecision.upsert({
      where: { eventId_areaRole: { eventId, areaRole } },
      create: {
        eventId,
        areaRole,
        estado: decision,
        userId: dbUser.id,
        reason: reasonStr,
      },
      update: {
        estado: decision,
        userId: dbUser.id,
        reason: reasonStr,
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    await tx.eventAudit.create({
      data: {
        eventId,
        userId: dbUser.id,
        action: decision === "APPROVED" ? "AREA_APPROVE" : "AREA_REJECT",
        field: areaRole,
        toValue: decision,
        reason: reasonStr,
      },
    });
    return row;
  });

  res.json({
    ...updated,
    label: AREA_LABELS[areaRole],
  });
});

/**
 * GET /events/:eventId/audits - Historial unificado de cambios del evento y sus requerimientos.
 */
eventDecisionsRouter.get("/:eventId/audits", authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const dbUser = await loadDbUser(req.user!.id);
  if (!dbUser || !canUserSeeEvent(dbUser, event)) {
    res.status(403).json({ error: "No tenés permiso" });
    return;
  }

  const [eventAudits, proposals] = await Promise.all([
    prisma.eventAudit.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, role: true } } },
    }),
    prisma.proposal.findMany({
      where: { eventId },
      select: {
        id: true,
        titulo: true,
        audits: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
  ]);

  const items = [
    ...eventAudits.map((a) => ({
      id: a.id,
      source: "event" as const,
      action: a.action,
      field: a.field,
      fromValue: a.fromValue,
      toValue: a.toValue,
      reason: a.reason,
      createdAt: a.createdAt,
      user: a.user,
      proposalId: null as string | null,
      proposalTitulo: null as string | null,
      fromStatus: null as string | null,
      toStatus: null as string | null,
    })),
    ...proposals.flatMap((p) =>
      p.audits.map((a) => ({
        id: a.id,
        source: "proposal" as const,
        action: a.action,
        field: null as string | null,
        fromValue: null as string | null,
        toValue: null as string | null,
        reason: a.reason,
        createdAt: a.createdAt,
        user: a.user,
        proposalId: p.id,
        proposalTitulo: p.titulo,
        fromStatus: a.fromStatus,
        toStatus: a.toStatus,
      }))
    ),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ items });
});

/**
 * PATCH /events/:eventId/fields
 * Edición parcial (ej. funcionario) por rol de especialidad, con registro de auditoría.
 * Body: { fields: { funcionario?: string, lugar?: string }, reason?: string }
 */
eventDecisionsRouter.patch("/:eventId/fields", authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const { fields, reason } = req.body ?? {};
  if (!fields || typeof fields !== "object") {
    res.status(400).json({ error: "fields requerido" });
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const dbUser = await loadDbUser(req.user!.id);
  if (!dbUser) {
    res.status(401).json({ error: "Usuario no encontrado" });
    return;
  }

  const canEdit =
    dbUser.role === "ADMIN" ||
    (isSpecialtyRole(dbUser.role) && isUserResponsibleForEvent(dbUser, event));
  if (!canEdit) {
    res.status(403).json({ error: "No tenés permiso para editar este evento" });
    return;
  }

  const allowed = ["funcionario", "lugar", "programa", "productor"] as const;
  // Referente de Producción: solo rol PRODUCCION o ADMIN
  if (fields.productor !== undefined && dbUser.role !== "ADMIN" && dbUser.role !== "PRODUCCION") {
    res.status(403).json({ error: "Solo Producción puede definir el referente de Producción" });
    return;
  }
  const updates: Record<string, string | null> = {};
  const changes: { field: string; from: string | null; to: string | null }[] = [];

  for (const key of allowed) {
    if (fields[key] === undefined) continue;
    const next =
      fields[key] == null || String(fields[key]).trim() === ""
        ? null
        : String(fields[key]).trim();
    const prev = (event as Record<string, unknown>)[key];
    const prevStr = prev == null ? null : String(prev);
    if (prevStr !== next) {
      updates[key] = next;
      changes.push({ field: key, from: prevStr, to: next });
    }
  }

  if (changes.length === 0) {
    res.status(400).json({ error: "No hay cambios para guardar" });
    return;
  }

  const reasonStr =
    reason != null && String(reason).trim() !== ""
      ? String(reason).trim()
      : `Editó: ${changes.map((c) => c.field).join(", ")}`;

  const updated = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.update({
      where: { id: eventId },
      data: updates,
    });
    for (const ch of changes) {
      await tx.eventAudit.create({
        data: {
          eventId,
          userId: dbUser.id,
          action: "EDIT",
          field: ch.field,
          fromValue: ch.from,
          toValue: ch.to,
          reason: reasonStr,
        },
      });
    }
    // Avisos por rol: tocar el requerimiento correspondiente
    const touchCategories = new Set<string>();
    if (updates.productor !== undefined) touchCategories.add("PRODUCCION");
    if (updates.funcionario !== undefined || updates.programa !== undefined) {
      touchCategories.add("AGENDA");
    }
    for (const categoria of touchCategories) {
      await tx.proposal.updateMany({
        where: { eventId, categoria },
        data: { updatedAt: new Date() },
      });
    }
    return ev;
  });

  res.json(updated);
});
