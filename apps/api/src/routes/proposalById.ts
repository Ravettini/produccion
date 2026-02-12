import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  canCreateProposal,
  canValidate,
} from "../middleware/auth.js";
export const proposalByIdRouter = Router();

const categories = ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"];
const impacts = ["ALTO", "MEDIO", "BAJO"];

function asProposalCategory(s: unknown): string {
  return typeof s === "string" && categories.includes(s) ? s : "OTRO";
}
function asProposalImpact(s: unknown): string {
  return typeof s === "string" && impacts.includes(s) ? s : "MEDIO";
}

/**
 * GET /proposals/:id - Detalle de propuesta con creador, comentarios y auditoría.
 */
proposalByIdRouter.get("/:id", authMiddleware, async (req, res) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true } },
      event: { select: { id: true, titulo: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      audits: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  res.json(proposal);
});

/**
 * PUT /proposals/:id - Editar solo si está en DRAFT y es el creador o admin.
 */
proposalByIdRouter.put("/:id", authMiddleware, async (req, res) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (proposal.estado !== "DRAFT") {
    res.status(400).json({ error: "Solo se puede editar una propuesta en estado DRAFT" });
    return;
  }
  if (proposal.createdById !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Solo el creador o un admin puede editar esta propuesta" });
    return;
  }
  const { titulo, nombreProyecto, descripcion, categoria, impacto, datosExtra } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (titulo !== undefined) data.titulo = String(titulo);
  if (nombreProyecto !== undefined) data.nombreProyecto = nombreProyecto == null || String(nombreProyecto).trim() === "" ? null : String(nombreProyecto).trim();
  if (descripcion !== undefined) data.descripcion = String(descripcion);
  if (categoria !== undefined) data.categoria = asProposalCategory(categoria);
  if (impacto !== undefined) data.impacto = asProposalImpact(impacto);
  if (datosExtra !== undefined) {
    data.datosExtra =
      datosExtra && typeof datosExtra === "object" && Object.keys(datosExtra).length > 0
        ? JSON.stringify(datosExtra)
        : null;
  }

  const updated = await prisma.proposal.update({
    where: { id: req.params.id },
    data: data as Parameters<typeof prisma.proposal.update>[0]["data"],
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  res.json(updated);
});

/**
 * POST /proposals/:id/submit - Pasar a SUBMITTED (solo DRAFT, solo creador o admin).
 */
proposalByIdRouter.post("/:id/submit", authMiddleware, async (req, res) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (proposal.estado !== "DRAFT") {
    res.status(400).json({ error: "Solo se puede enviar una propuesta en DRAFT" });
    return;
  }
  if (proposal.createdById !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Solo el creador o un admin puede enviar" });
    return;
  }
  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: req.params.id },
      data: { estado: "SUBMITTED" },
    }),
    prisma.proposalAudit.create({
      data: {
        proposalId: req.params.id,
        userId: req.user!.id,
        action: "SUBMIT",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
      },
    }),
  ]);
  const updated = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  res.json(updated);
});

/**
 * POST /proposals/:id/approve - Solo VALIDADOR o ADMIN, solo si está SUBMITTED.
 */
proposalByIdRouter.post("/:id/approve", authMiddleware, canValidate, async (req, res) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (proposal.estado !== "SUBMITTED") {
    res.status(400).json({ error: "Solo se puede aprobar una propuesta en SUBMITTED" });
    return;
  }
  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: req.params.id },
      data: { estado: "APPROVED", validatedById: req.user!.id, decisionReason: null },
    }),
    prisma.proposalAudit.create({
      data: {
        proposalId: req.params.id,
        userId: req.user!.id,
        action: "APPROVE",
        fromStatus: "SUBMITTED",
        toStatus: "APPROVED",
      },
    }),
  ]);
  const updated = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
});

/**
 * POST /proposals/:id/reject - Solo VALIDADOR o ADMIN, solo SUBMITTED. Body: { decisionReason }
 */
proposalByIdRouter.post("/:id/reject", authMiddleware, canValidate, async (req, res) => {
  const { decisionReason } = req.body ?? {};
  if (!decisionReason || String(decisionReason).trim() === "") {
    res.status(400).json({ error: "decisionReason es obligatorio al rechazar" });
    return;
  }
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (proposal.estado !== "SUBMITTED") {
    res.status(400).json({ error: "Solo se puede rechazar una propuesta en SUBMITTED" });
    return;
  }
  const reason = String(decisionReason).trim();
  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: req.params.id },
      data: { estado: "REJECTED", validatedById: req.user!.id, decisionReason: reason },
    }),
    prisma.proposalAudit.create({
      data: {
        proposalId: req.params.id,
        userId: req.user!.id,
        action: "REJECT",
        fromStatus: "SUBMITTED",
        toStatus: "REJECTED",
        reason,
      },
    }),
  ]);
  const updated = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
});

/**
 * POST /proposals/:id/cancel - Pasar a CANCELLED (creador o admin, si no está ya aprobada/rechazada).
 */
proposalByIdRouter.post("/:id/cancel", authMiddleware, async (req, res) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (["APPROVED", "REJECTED", "CANCELLED"].includes(proposal.estado)) {
    res.status(400).json({ error: "No se puede cancelar en estado " + proposal.estado });
    return;
  }
  if (proposal.createdById !== req.user!.id && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Solo el creador o un admin puede cancelar" });
    return;
  }
  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: req.params.id },
      data: { estado: "CANCELLED" },
    }),
    prisma.proposalAudit.create({
      data: {
        proposalId: req.params.id,
        userId: req.user!.id,
        action: "CANCEL",
        fromStatus: proposal.estado,
        toStatus: "CANCELLED",
      },
    }),
  ]);
  const updated = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  res.json(updated);
});

/**
 * GET /proposals/:id/comments - Comentarios de la propuesta.
 */
proposalByIdRouter.get("/:id/comments", authMiddleware, async (req, res) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  const comments = await prisma.proposalComment.findMany({
    where: { proposalId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(comments);
});

/**
 * POST /proposals/:id/comments - Crear comentario. Body: { body }
 */
proposalByIdRouter.post("/:id/comments", authMiddleware, async (req, res) => {
  const { body } = req.body ?? {};
  if (!body || String(body).trim() === "") {
    res.status(400).json({ error: "body del comentario requerido" });
    return;
  }
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
  if (!proposal) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  const comment = await prisma.proposalComment.create({
    data: {
      proposalId: req.params.id,
      userId: req.user!.id,
      body: String(body).trim(),
    },
    include: { user: { select: { id: true, name: true } } },
  });
  res.status(201).json(comment);
});
