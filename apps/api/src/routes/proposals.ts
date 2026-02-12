import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  canCreateProposal,
  canValidate,
} from "../middleware/auth.js";
const router = Router({ mergeParams: true });

const categories = ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"];
const impacts = ["ALTO", "MEDIO", "BAJO"];

function asProposalCategory(s: unknown): string {
  return typeof s === "string" && categories.includes(s) ? s : "OTRO";
}
function asProposalImpact(s: unknown): string {
  return typeof s === "string" && impacts.includes(s) ? s : "MEDIO";
}

/**
 * GET /events/:eventId/proposals - Listado de propuestas de un evento.
 */
router.get("/:eventId/proposals", authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const list = await prisma.proposal.findMany({
    where: { eventId },
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true } },
    },
  });
  res.json(list);
});

/**
 * POST /events/:eventId/proposals - Crear propuesta (solo roles que pueden proponer).
 */
router.post("/:eventId/proposals", authMiddleware, canCreateProposal, async (req, res) => {
  const { eventId } = req.params;
  const { titulo, nombreProyecto, descripcion, categoria, impacto, datosExtra } = req.body ?? {};
  if (!titulo || !descripcion) {
    res.status(400).json({ error: "titulo y descripcion requeridos" });
    return;
  }
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const datosExtraStr =
    datosExtra && typeof datosExtra === "object" && Object.keys(datosExtra).length > 0
      ? JSON.stringify(datosExtra)
      : null;
  const proposal = await prisma.proposal.create({
    data: {
      eventId,
      titulo: String(titulo),
      nombreProyecto: nombreProyecto != null && String(nombreProyecto).trim() !== "" ? String(nombreProyecto).trim() : null,
      descripcion: String(descripcion),
      categoria: asProposalCategory(categoria),
      impacto: asProposalImpact(impacto),
      datosExtra: datosExtraStr,
      estado: "DRAFT",
      createdById: req.user!.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  await prisma.proposalAudit.create({
    data: {
      proposalId: proposal.id,
      userId: req.user!.id,
      action: "CREATE",
      toStatus: "DRAFT",
    },
  });
  res.status(201).json(proposal);
});

export { router as proposalsRouter };
