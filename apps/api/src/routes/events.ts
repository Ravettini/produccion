import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";

export const eventsRouter = Router();

const validStatuses = ["BORRADOR", "EN_ANALISIS", "CONFIRMADO", "CANCELADO", "REALIZADO"];

/**
 * GET /events - Listado de eventos (todos pueden ver).
 */
eventsRouter.get("/", authMiddleware, async (_req, res) => {
  const list = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { proposals: true } },
    },
  });
  res.json(list);
});

/**
 * GET /events/:id - Detalle de un evento.
 */
eventsRouter.get("/:id", authMiddleware, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { proposals: true } } },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  res.json(event);
});

/**
 * POST /events - Crear evento (requiere auth; en MVP todos autenticados pueden crear).
 */
eventsRouter.post("/", authMiddleware, async (req, res) => {
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
  let status = estado && validStatuses.includes(String(estado)) ? String(estado) : "BORRADOR";
  if (req.user?.role === "DIRECTOR_GENERAL") {
    status = "EN_ANALISIS";
  } else if (status === "CONFIRMADO" && req.user?.role !== "ADMIN") {
    status = "BORRADOR";
  }
  const validPublico = ["EXTERNO", "INTERNO", "MIXTO"].includes(String(publico)) ? String(publico) : null;
  let usuarioSolicitante: string | null =
    bodyUsuario !== undefined && String(bodyUsuario).trim() !== "" ? String(bodyUsuario).trim() : null;
  if (usuarioSolicitante === null && req.user?.id) {
    const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    usuarioSolicitante = u?.name ?? null;
  }
  const event = await prisma.event.create({
    data: {
      titulo: String(titulo),
      descripcion: String(descripcion),
      tipoEvento: String(tipoEvento),
      areaSolicitante: String(areaSolicitante),
      fechaTentativa: new Date(fechaTentativa),
      estado: status,
      resumen: resumen !== undefined && resumen !== null ? String(resumen) : undefined,
      usuarioSolicitante,
      publico: validPublico,
      lugar: lugar !== undefined && String(lugar).trim() !== "" ? String(lugar).trim() : null,
      programa: programa !== undefined && String(programa).trim() !== "" ? String(programa).trim() : null,
      funcionario: funcionario !== undefined && String(funcionario).trim() !== "" ? String(funcionario).trim() : null,
      necesitaAcreditacion: necesitaAcreditacion === undefined ? undefined : (necesitaAcreditacion === true || String(necesitaAcreditacion) === "true"),
      linkAcreditacionConvocados: linkAcreditacionConvocados !== undefined && String(linkAcreditacionConvocados).trim() !== "" ? String(linkAcreditacionConvocados).trim() : null,
      motivoCancelacion: motivoCancelacion != null && String(motivoCancelacion).trim() !== "" ? String(motivoCancelacion).trim() : null,
      realizacionAsistentes: realizacionAsistentes != null && (typeof realizacionAsistentes === "number" ? !Number.isNaN(realizacionAsistentes) : String(realizacionAsistentes).trim() !== "") ? (typeof realizacionAsistentes === "number" ? realizacionAsistentes : parseInt(String(realizacionAsistentes), 10)) : null,
      realizacionImpacto: realizacionImpacto != null && String(realizacionImpacto).trim() !== "" ? String(realizacionImpacto).trim() : null,
      realizacionLinkImpacto: realizacionLinkImpacto != null && String(realizacionLinkImpacto).trim() !== "" ? String(realizacionLinkImpacto).trim() : null,
      datosProduccion: datosProduccion != null && typeof datosProduccion === "object" ? JSON.stringify(datosProduccion) : (typeof datosProduccion === "string" && datosProduccion.trim() !== "" ? datosProduccion : null),
    },
  });
  res.status(201).json(event);
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
  if (fechaTentativa !== undefined) updates.fechaTentativa = new Date(fechaTentativa);
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
  res.json(event);
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
