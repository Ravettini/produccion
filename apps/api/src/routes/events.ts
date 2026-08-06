import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { canUserSeeEvent, filterEventsForUser } from "../lib/eventVisibility.js";
import { buildAreaChecklist, type AreaDecisionRow } from "../lib/areaDecisions.js";
import { ensureAcreditappLink } from "../lib/acreditapp.js";
import { syncProposalsFromEvent } from "../lib/syncProposalsFromEvent.js";
import {
  civilDateFromStored,
  dayBoundsFromCivil,
  parseFechaTentativa,
  serializeEventFecha,
} from "../lib/fechaTentativa.js";

export const eventsRouter = Router();

const validStatuses = ["PENDIENTE", "EN_RADAR", "EN_ANALISIS", "CONFIRMADO", "CANCELADO", "REALIZADO"];

function toAcreditappEventInput(event: {
  id: unknown;
  titulo: unknown;
  descripcion?: unknown;
  lugar?: unknown;
  fechaTentativa?: unknown;
  necesitaAcreditacion?: unknown;
  linkAcreditacionConvocados?: unknown;
  datosProduccion?: unknown;
}) {
  return {
    id: String(event.id),
    titulo: String(event.titulo),
    descripcion: event.descripcion != null ? String(event.descripcion) : null,
    lugar: event.lugar != null && String(event.lugar).trim() !== "" ? String(event.lugar) : null,
    fechaTentativa:
      event.fechaTentativa instanceof Date || typeof event.fechaTentativa === "string"
        ? event.fechaTentativa
        : null,
    necesitaAcreditacion: event.necesitaAcreditacion === true,
    linkAcreditacionConvocados:
      event.linkAcreditacionConvocados != null && String(event.linkAcreditacionConvocados).trim() !== ""
        ? String(event.linkAcreditacionConvocados).trim()
        : null,
    datosProduccion: event.datosProduccion ?? null,
  };
}

async function countEventsSameDayDg(areaSolicitante: string, fecha: Date, excludeId?: string) {
  const civil = civilDateFromStored(fecha);
  const { start, end } = dayBoundsFromCivil(civil);
  return prisma.event.count({
    where: {
      areaSolicitante,
      fechaTentativa: { gte: start, lte: end },
      estado: { not: "CANCELADO" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

/**
 * GET /events - Listado visible según el rol del usuario.
 */
eventsRouter.get("/", authMiddleware, async (req, res) => {
  const list = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { proposals: true } },
      proposals: {
        select: {
          id: true,
          categoria: true,
          titulo: true,
          estado: true,
          updatedAt: true,
          createdAt: true,
        },
      },
      areaDecisions: {
        select: {
          areaRole: true,
          estado: true,
          reason: true,
          updatedAt: true,
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, role: true, area: true },
  });
  if (!dbUser) {
    res.status(401).json({ error: "Usuario no encontrado" });
    return;
  }
  const visible = filterEventsForUser(
    { id: dbUser.id, role: dbUser.role, area: dbUser.area },
    list
  );
  res.json(
    visible.map((event) =>
      serializeEventFecha({
        ...event,
        areaChecklist: buildAreaChecklist(
          event.tipoEvento,
          event.areaDecisions as AreaDecisionRow[]
        ),
      })
    )
  );
});

/**
 * GET /events/:id - Detalle de un evento (si el rol puede verlo).
 */
eventsRouter.get("/:id", authMiddleware, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { proposals: true } },
      areaDecisions: {
        select: {
          areaRole: true,
          estado: true,
          reason: true,
          updatedAt: true,
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, role: true, area: true },
  });
  if (!dbUser) {
    res.status(401).json({ error: "Usuario no encontrado" });
    return;
  }
  if (!canUserSeeEvent({ id: dbUser.id, role: dbUser.role, area: dbUser.area }, event)) {
    res.status(403).json({ error: "No tenés permiso para ver este evento" });
    return;
  }
  res.json(
    serializeEventFecha({
      ...event,
      areaChecklist: buildAreaChecklist(
        event.tipoEvento,
        event.areaDecisions as AreaDecisionRow[]
      ),
    })
  );
});

/**
 * POST /events - Crear evento (solicitantes / admin).
 */
eventsRouter.post("/", authMiddleware, async (req, res) => {
  const role = req.user?.role;
  if (!role || !["ORGANIZACION", "ADMIN", "DIRECTOR_GENERAL", "INSTITUCIONALES", "AGENDA"].includes(role)) {
    res.status(403).json({ error: "Tu rol no puede crear eventos. Solo podés gestionar los que te solicitaron." });
    return;
  }
  const {
    titulo,
    descripcion,
    tipoEvento,
    areaSolicitante,
    fechaTentativa,
    estado,
    resumen,
    publico,
    usuarioSolicitante: bodyUsuario,
    lugar,
    programa,
    funcionario,
    productor,
    necesitaAcreditacion,
    linkAcreditacionConvocados,
    motivoCancelacion,
    realizacionAsistentes,
    realizacionImpacto,
    realizacionLinkImpacto,
    datosProduccion,
  } = req.body ?? {};
  if (!titulo || !descripcion || !tipoEvento || !areaSolicitante || !fechaTentativa) {
    res.status(400).json({
      error: "Faltan campos: titulo, descripcion, tipoEvento, areaSolicitante, fechaTentativa",
    });
    return;
  }
  let status = estado && validStatuses.includes(String(estado)) ? String(estado) : "PENDIENTE";
  if (req.user?.role !== "ADMIN") {
    status = "PENDIENTE";
  } else if (status === "CONFIRMADO" && req.user?.role !== "ADMIN") {
    status = "PENDIENTE";
  }
  const fechaDate = parseFechaTentativa(fechaTentativa);
  const area = String(areaSolicitante);
  const sameDayCount = await countEventsSameDayDg(area, fechaDate);
  if (sameDayCount >= 2) {
    res.status(400).json({
      error: "Cada dirección general puede cargar como máximo 2 eventos el mismo día.",
    });
    return;
  }
  const validPublico = ["EXTERNO", "INTERNO", "MIXTO"].includes(String(publico)) ? String(publico) : null;
  let usuarioSolicitante: string | null =
    bodyUsuario !== undefined && String(bodyUsuario).trim() !== "" ? String(bodyUsuario).trim() : null;
  if (usuarioSolicitante === null && req.user?.id) {
    const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    usuarioSolicitante = u?.name ? String(u.name) : null;
  }
  const resumenFinal =
    resumen !== undefined && resumen !== null && String(resumen).trim() !== ""
      ? String(resumen)
      : null;
  const event = await prisma.event.create({
    data: {
      titulo: String(titulo),
      descripcion: String(descripcion),
      tipoEvento: String(tipoEvento),
      areaSolicitante: String(areaSolicitante),
      fechaTentativa: fechaDate,
      estado: status,
      createdById: req.user?.id ?? null,
      resumen: resumenFinal,
      usuarioSolicitante,
      publico: validPublico,
      lugar: lugar !== undefined && String(lugar).trim() !== "" ? String(lugar).trim() : null,
      programa: programa !== undefined && String(programa).trim() !== "" ? String(programa).trim() : null,
          funcionario: funcionario !== undefined && String(funcionario).trim() !== "" ? String(funcionario).trim() : null,
          productor: productor !== undefined && String(productor).trim() !== "" ? String(productor).trim() : null,
          necesitaAcreditacion: necesitaAcreditacion === undefined ? undefined : (necesitaAcreditacion === true || String(necesitaAcreditacion) === "true"),
      linkAcreditacionConvocados: linkAcreditacionConvocados !== undefined && String(linkAcreditacionConvocados).trim() !== "" ? String(linkAcreditacionConvocados).trim() : null,
      motivoCancelacion: motivoCancelacion != null && String(motivoCancelacion).trim() !== "" ? String(motivoCancelacion).trim() : null,
      realizacionAsistentes: realizacionAsistentes != null && (typeof realizacionAsistentes === "number" ? !Number.isNaN(realizacionAsistentes) : String(realizacionAsistentes).trim() !== "") ? (typeof realizacionAsistentes === "number" ? realizacionAsistentes : parseInt(String(realizacionAsistentes), 10)) : null,
      realizacionImpacto: realizacionImpacto != null && String(realizacionImpacto).trim() !== "" ? String(realizacionImpacto).trim() : null,
      realizacionLinkImpacto: realizacionLinkImpacto != null && String(realizacionLinkImpacto).trim() !== "" ? String(realizacionLinkImpacto).trim() : null,
      datosProduccion: datosProduccion != null && typeof datosProduccion === "object" ? JSON.stringify(datosProduccion) : (typeof datosProduccion === "string" && datosProduccion.trim() !== "" ? datosProduccion : null),
    },
  });

  if (req.user?.id) {
    try {
      await syncProposalsFromEvent({
        eventId: String(event.id),
        userId: req.user.id,
        tipoEvento: String(event.tipoEvento),
        lugar: event.lugar,
        funcionario: event.funcionario,
        programa: event.programa,
        datosProduccion: event.datosProduccion,
      });
    } catch (err) {
      console.error("[events] syncProposalsFromEvent:", err);
    }
  }

  const sync = await ensureAcreditappLink(toAcreditappEventInput(event));
  let result = event;
  const currentLink =
    event.linkAcreditacionConvocados != null
      ? String(event.linkAcreditacionConvocados)
      : "";
  if (sync.link && sync.link !== currentLink) {
    result = await prisma.event.update({
      where: { id: String(event.id) },
      data: { linkAcreditacionConvocados: sync.link },
    });
  }
  const payload = serializeEventFecha(result);
  res.status(201).json(
    sync.warning ? { ...payload, acreditappWarning: sync.warning } : payload
  );
});

/**
 * PUT /events/:id - Editar evento.
 */
eventsRouter.put("/:id", authMiddleware, async (req, res) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const existingCreatedBy = (existing as { createdById?: string | null }).createdById;
  if (req.user?.role !== "ADMIN" && existingCreatedBy && existingCreatedBy !== req.user?.id) {
    res.status(403).json({ error: "Solo el creador o un admin puede editar este evento" });
    return;
  }
  const {
    titulo,
    descripcion,
    tipoEvento,
    areaSolicitante,
    fechaTentativa,
    estado,
    resumen,
    publico,
    usuarioSolicitante,
    lugar,
    programa,
    funcionario,
    productor,
    necesitaAcreditacion,
    linkAcreditacionConvocados,
    motivoCancelacion,
    realizacionAsistentes,
    realizacionImpacto,
    realizacionLinkImpacto,
    datosProduccion,
  } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (titulo !== undefined) updates.titulo = String(titulo);
  if (descripcion !== undefined) updates.descripcion = String(descripcion);
  if (tipoEvento !== undefined) updates.tipoEvento = String(tipoEvento);
  if (areaSolicitante !== undefined) updates.areaSolicitante = String(areaSolicitante);
  if (fechaTentativa !== undefined) {
    const fechaDate = parseFechaTentativa(fechaTentativa);
    updates.fechaTentativa = fechaDate;
    const areaCheck = areaSolicitante !== undefined ? String(areaSolicitante) : existing.areaSolicitante;
    const sameDayCount = await countEventsSameDayDg(areaCheck, fechaDate, req.params.id);
    if (sameDayCount >= 2) {
      res.status(400).json({
        error: "Cada dirección general puede cargar como máximo 2 eventos el mismo día.",
      });
      return;
    }
  } else if (areaSolicitante !== undefined) {
    const sameDayCount = await countEventsSameDayDg(String(areaSolicitante), existing.fechaTentativa, req.params.id);
    if (sameDayCount >= 2) {
      res.status(400).json({
        error: "Cada dirección general puede cargar como máximo 2 eventos el mismo día.",
      });
      return;
    }
  }
  if (estado !== undefined && validStatuses.includes(String(estado))) {
    if (req.user?.role === "DIRECTOR_GENERAL") {
      res.status(403).json({ error: "El Director General no puede cambiar el estado del evento" });
      return;
    }
    if (String(estado) === "CONFIRMADO" && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Solo un administrador puede confirmar el evento" });
      return;
    }
    if (String(estado) === "CANCELADO") {
      const motivo = motivoCancelacion != null ? String(motivoCancelacion).trim() : (existing as { motivoCancelacion?: string | null }).motivoCancelacion ?? "";
      if (!motivo) {
        res.status(400).json({ error: "Al cancelar el evento es obligatorio indicar el motivo o razón de cancelación." });
        return;
      }
      updates.motivoCancelacion = motivo;
    }
    updates.estado = String(estado);
  }
  if (resumen !== undefined) updates.resumen = resumen === null || resumen === "" ? null : String(resumen);
  if (publico !== undefined) {
    updates.publico = ["EXTERNO", "INTERNO", "MIXTO"].includes(String(publico)) ? String(publico) : null;
  }
  if (usuarioSolicitante !== undefined) {
    updates.usuarioSolicitante = usuarioSolicitante === null || String(usuarioSolicitante).trim() === "" ? null : String(usuarioSolicitante).trim();
  }
  if (lugar !== undefined) {
    updates.lugar = lugar === null || String(lugar).trim() === "" ? null : String(lugar).trim();
  }
  if (programa !== undefined) {
    updates.programa = programa === null || String(programa).trim() === "" ? null : String(programa).trim();
  }
  if (funcionario !== undefined) {
    updates.funcionario = funcionario === null || String(funcionario).trim() === "" ? null : String(funcionario).trim();
  }
  if (productor !== undefined) {
    updates.productor = productor === null || String(productor).trim() === "" ? null : String(productor).trim();
  }
  if (necesitaAcreditacion !== undefined) {
    updates.necesitaAcreditacion = necesitaAcreditacion === true || String(necesitaAcreditacion) === "true";
  }
  if (linkAcreditacionConvocados !== undefined) {
    updates.linkAcreditacionConvocados = linkAcreditacionConvocados === null || String(linkAcreditacionConvocados).trim() === "" ? null : String(linkAcreditacionConvocados).trim();
  }
  if (motivoCancelacion !== undefined) {
    updates.motivoCancelacion = motivoCancelacion == null || String(motivoCancelacion).trim() === "" ? null : String(motivoCancelacion).trim();
  }
  if (realizacionAsistentes !== undefined) {
    const n = realizacionAsistentes === null || String(realizacionAsistentes).trim() === "" ? null : parseInt(String(realizacionAsistentes), 10);
    updates.realizacionAsistentes = n != null && !Number.isNaN(n) ? n : null;
  }
  if (realizacionImpacto !== undefined) {
    updates.realizacionImpacto = realizacionImpacto == null || String(realizacionImpacto).trim() === "" ? null : String(realizacionImpacto).trim();
  }
  if (realizacionLinkImpacto !== undefined) {
    updates.realizacionLinkImpacto = realizacionLinkImpacto == null || String(realizacionLinkImpacto).trim() === "" ? null : String(realizacionLinkImpacto).trim();
  }
  if (datosProduccion !== undefined) {
    updates.datosProduccion = datosProduccion == null || (typeof datosProduccion === "string" && datosProduccion.trim() === "")
      ? null
      : typeof datosProduccion === "object"
        ? JSON.stringify(datosProduccion)
        : String(datosProduccion);
  }

  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: updates as Parameters<typeof prisma.event.update>[0]["data"],
  });

  if (req.user?.id) {
    try {
      await syncProposalsFromEvent({
        eventId: String(event.id),
        userId: req.user.id,
        tipoEvento: String(event.tipoEvento),
        lugar: event.lugar,
        funcionario: event.funcionario,
        programa: event.programa,
        datosProduccion: event.datosProduccion,
      });
    } catch (err) {
      console.error("[events] syncProposalsFromEvent:", err);
    }
  }

  const sync = await ensureAcreditappLink(toAcreditappEventInput(event));
  let result = event;
  const currentLink =
    event.linkAcreditacionConvocados != null
      ? String(event.linkAcreditacionConvocados)
      : "";
  if (sync.link && sync.link !== currentLink) {
    result = await prisma.event.update({
      where: { id: String(event.id) },
      data: { linkAcreditacionConvocados: sync.link },
    });
  }
  const payload = serializeEventFecha(result);
  res.json(sync.warning ? { ...payload, acreditappWarning: sync.warning } : payload);
});

/**
 * POST /events/:id/sync-acreditapp - Crear/reintentar evento remoto en Acreditapp.
 */
eventsRouter.post("/:id/sync-acreditapp", authMiddleware, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const existingCreatedBy = (event as { createdById?: string | null }).createdById;
  if (req.user?.role !== "ADMIN" && existingCreatedBy && existingCreatedBy !== req.user?.id) {
    res.status(403).json({ error: "Solo el creador o un admin puede sincronizar acreditación" });
    return;
  }
  if (event.necesitaAcreditacion !== true) {
    res.status(400).json({ error: "El evento no tiene acreditación habilitada" });
    return;
  }
  const mapped = toAcreditappEventInput(event as {
    id: unknown;
    titulo: unknown;
    descripcion?: unknown;
    lugar?: unknown;
    fechaTentativa?: unknown;
    necesitaAcreditacion?: unknown;
    linkAcreditacionConvocados?: unknown;
    datosProduccion?: unknown;
  });
  if (mapped.linkAcreditacionConvocados) {
    res.json({ linkAcreditacionConvocados: mapped.linkAcreditacionConvocados });
    return;
  }

  const sync = await ensureAcreditappLink(mapped);
  if (sync.link) {
    const updated = await prisma.event.update({
      where: { id: String((event as { id: unknown }).id) },
      data: { linkAcreditacionConvocados: sync.link },
    });
    res.json({
      linkAcreditacionConvocados:
        (updated as { linkAcreditacionConvocados?: string | null }).linkAcreditacionConvocados != null
          ? String((updated as { linkAcreditacionConvocados: string | null }).linkAcreditacionConvocados)
          : sync.link,
    });
    return;
  }
  res.status(502).json({
    error: sync.warning ?? "No se pudo crear el evento en Acreditapp",
  });
});

/**
 * DELETE /events/:id - Eliminar evento (solo ADMIN).
 */
eventsRouter.delete("/:id", authMiddleware, requireRoles("ADMIN"), async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
