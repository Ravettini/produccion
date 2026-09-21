import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { canUserSeeEvent, filterEventsForUser } from "../lib/eventVisibility.js";
import { buildAreaChecklist, type AreaDecisionRow } from "../lib/areaDecisions.js";
import { ensureAcreditappLink, fetchAcreditappAttendance } from "../lib/acreditapp.js";
import { notifyEventCreated, notifyEventStatusChanged } from "../lib/mail.js";
import { syncProposalsFromEvent } from "../lib/syncProposalsFromEvent.js";
import {
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
          event.areaDecisions as AreaDecisionRow[],
          event.areaSolicitante
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
        event.areaDecisions as AreaDecisionRow[],
        event.areaSolicitante
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
    realizacionConvocados,
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
  const isAutoConfirmed =
    /responsabilidad\s+social/i.test(String(areaSolicitante)) ||
    /solo\s+informar/i.test(String(tipoEvento));
  let status = estado && validStatuses.includes(String(estado)) ? String(estado) : "PENDIENTE";
  if (isAutoConfirmed) {
    status = "CONFIRMADO";
  } else if (req.user?.role !== "ADMIN") {
    status = "PENDIENTE";
  } else if (status === "CONFIRMADO" && req.user?.role !== "ADMIN") {
    status = "PENDIENTE";
  }
  const fechaDate = parseFechaTentativa(fechaTentativa);
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
      realizacionConvocados: realizacionConvocados != null && (typeof realizacionConvocados === "number" ? !Number.isNaN(realizacionConvocados) : String(realizacionConvocados).trim() !== "") ? (typeof realizacionConvocados === "number" ? realizacionConvocados : parseInt(String(realizacionConvocados), 10)) : null,
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
  notifyEventCreated({
    id: String(result.id),
    titulo: String(result.titulo),
    areaSolicitante: result.areaSolicitante != null ? String(result.areaSolicitante) : null,
    fechaTentativa: result.fechaTentativa as Date | string | null,
    estado: result.estado != null ? String(result.estado) : null,
    tipoEvento: result.tipoEvento != null ? String(result.tipoEvento) : null,
  });
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
    realizacionConvocados,
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
    updates.fechaTentativa = parseFechaTentativa(fechaTentativa);
  }
  const resultingArea = updates.areaSolicitante !== undefined ? String(updates.areaSolicitante) : existing.areaSolicitante;
  const resultingTipo = updates.tipoEvento !== undefined ? String(updates.tipoEvento) : existing.tipoEvento;
  const isAutoConfirmed =
    /responsabilidad\s+social/i.test(String(resultingArea)) ||
    /solo\s+informar/i.test(String(resultingTipo));

  if (estado !== undefined && validStatuses.includes(String(estado))) {
    if (isAutoConfirmed && String(estado) === "CONFIRMADO") {
      updates.estado = "CONFIRMADO";
    } else if (req.user?.role === "DIRECTOR_GENERAL") {
      res.status(403).json({ error: "El Director General no puede cambiar el estado del evento" });
      return;
    } else if (String(estado) === "CONFIRMADO" && req.user?.role !== "ADMIN") {
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
  if (realizacionConvocados !== undefined) {
    const n = realizacionConvocados === null || String(realizacionConvocados).trim() === "" ? null : parseInt(String(realizacionConvocados), 10);
    updates.realizacionConvocados = n != null && !Number.isNaN(n) ? n : null;
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

  // Al cerrar/realizar: si usa Acreditapp, traer convocados y asistidos automáticamente.
  const nextEstado = updates.estado !== undefined ? String(updates.estado) : existing.estado;
  const closingNow = nextEstado === "REALIZADO" && existing.estado !== "REALIZADO";
  const needsAcreditacion =
    updates.necesitaAcreditacion !== undefined
      ? updates.necesitaAcreditacion === true
      : existing.necesitaAcreditacion === true;
  const linkForStats =
    (updates.linkAcreditacionConvocados !== undefined
      ? (updates.linkAcreditacionConvocados as string | null)
      : existing.linkAcreditacionConvocados) ?? null;

  let acreditappStatsWarning: string | undefined;
  if (closingNow && needsAcreditacion && linkForStats) {
    try {
      const stats = await fetchAcreditappAttendance(String(linkForStats));
      updates.realizacionConvocados = stats.convocados;
      updates.realizacionAsistentes = stats.asistidos;
    } catch (err) {
      acreditappStatsWarning =
        err instanceof Error
          ? err.message
          : "No se pudieron obtener convocados/asistidos desde Acreditapp.";
      console.error("[events] fetchAcreditappAttendance:", acreditappStatsWarning);
    }
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
  const warning = sync.warning || acreditappStatsWarning;
  const prevEstado = String(existing.estado);
  const nextEstadoResult = String(result.estado);
  if (prevEstado !== nextEstadoResult) {
    notifyEventStatusChanged(
      {
        id: String(result.id),
        titulo: String(result.titulo),
        areaSolicitante: result.areaSolicitante != null ? String(result.areaSolicitante) : null,
        fechaTentativa: result.fechaTentativa as Date | string | null,
        estado: nextEstadoResult,
        tipoEvento: result.tipoEvento != null ? String(result.tipoEvento) : null,
      },
      prevEstado,
      nextEstadoResult
    );
  }
  res.json(warning ? { ...payload, acreditappWarning: warning } : payload);
});

/**
 * GET /events/:id/acreditapp-stats - Consultar convocados/asistidos en Acreditapp (preview).
 */
eventsRouter.get("/:id/acreditapp-stats", authMiddleware, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, role: true, area: true },
  });
  if (!dbUser || !canUserSeeEvent({ id: dbUser.id, role: dbUser.role, area: dbUser.area }, event)) {
    res.status(403).json({ error: "No tenés permiso para ver este evento" });
    return;
  }
  if (event.necesitaAcreditacion !== true) {
    res.status(400).json({ error: "El evento no usa Acreditapp" });
    return;
  }
  const link = event.linkAcreditacionConvocados?.trim();
  if (!link) {
    res.status(400).json({ error: "El evento aún no tiene link de Acreditapp" });
    return;
  }
  try {
    const stats = await fetchAcreditappAttendance(link);
    res.json(stats);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "No se pudieron obtener estadísticas de Acreditapp",
    });
  }
});

/**
 * POST /events/:id/clone - Duplicar un evento existente (sin decisiones ni acreditación).
 */
eventsRouter.post("/:id/clone", authMiddleware, async (req, res) => {
  const role = req.user?.role;
  if (!role || !["ORGANIZACION", "ADMIN", "DIRECTOR_GENERAL", "INSTITUCIONALES", "AGENDA"].includes(role)) {
    res.status(403).json({ error: "Tu rol no puede duplicar eventos." });
    return;
  }

  const source = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!source) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, role: true, area: true, name: true },
  });
  if (!dbUser || !canUserSeeEvent({ id: dbUser.id, role: dbUser.role, area: dbUser.area }, source)) {
    res.status(403).json({ error: "No tenés permiso para ver este evento" });
    return;
  }

  const isAutoConfirmed =
    /responsabilidad\s+social/i.test(String(source.areaSolicitante)) ||
    /solo\s+informar/i.test(String(source.tipoEvento));
  const status = isAutoConfirmed ? "CONFIRMADO" : "PENDIENTE";

  const fechaDate =
    source.fechaTentativa instanceof Date
      ? source.fechaTentativa
      : parseFechaTentativa(source.fechaTentativa);

  const baseTitle = String(source.titulo).replace(/\s*\(copia(?:\s*\d+)?\)\s*$/i, "").trim();
  const titulo = `${baseTitle} (copia)`.slice(0, 240);

  let datosProduccion: string | null = null;
  if (source.datosProduccion != null) {
    datosProduccion =
      typeof source.datosProduccion === "string"
        ? source.datosProduccion
        : JSON.stringify(source.datosProduccion);
  }

  const event = await prisma.event.create({
    data: {
      titulo,
      descripcion: String(source.descripcion),
      tipoEvento: String(source.tipoEvento),
      areaSolicitante: String(source.areaSolicitante),
      fechaTentativa: fechaDate,
      estado: status,
      createdById: req.user?.id ?? null,
      resumen: null,
      usuarioSolicitante: dbUser.name ? String(dbUser.name) : source.usuarioSolicitante,
      publico: source.publico ?? null,
      lugar: source.lugar ?? null,
      programa: source.programa ?? null,
      funcionario: source.funcionario ?? null,
      productor: source.productor ?? null,
      necesitaAcreditacion: source.necesitaAcreditacion === true,
      linkAcreditacionConvocados: null,
      motivoCancelacion: null,
      realizacionAsistentes: null,
      realizacionImpacto: null,
      realizacionLinkImpacto: null,
      datosProduccion,
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
      console.error("[events] clone syncProposalsFromEvent:", err);
    }
  }

  const sync = await ensureAcreditappLink(toAcreditappEventInput(event));
  let result = event;
  if (sync.link) {
    result = await prisma.event.update({
      where: { id: String(event.id) },
      data: { linkAcreditacionConvocados: sync.link },
    });
  }
  const payload = serializeEventFecha(result);
  notifyEventCreated({
    id: String(result.id),
    titulo: String(result.titulo),
    areaSolicitante: result.areaSolicitante != null ? String(result.areaSolicitante) : null,
    fechaTentativa: result.fechaTentativa as Date | string | null,
    estado: result.estado != null ? String(result.estado) : null,
    tipoEvento: result.tipoEvento != null ? String(result.tipoEvento) : null,
  });
  res.status(201).json(
    sync.warning ? { ...payload, acreditappWarning: sync.warning } : payload
  );
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
 * DELETE /events/:id - Eliminar evento (ADMIN, o creador / área solicitante con rol DIRECTOR_GENERAL u ORGANIZACION).
 */
eventsRouter.delete("/:id", authMiddleware, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const user = req.user;
  const isAdmin = user?.role === "ADMIN";
  const isCreator = Boolean(event.createdById && event.createdById === user?.id);
  const isAreaOwner = Boolean(
    user?.area &&
    event.areaSolicitante &&
    user.area.toLowerCase() === event.areaSolicitante.toLowerCase() &&
    (user.role === "DIRECTOR_GENERAL" || user.role === "ORGANIZACION")
  );

  if (!isAdmin && !isCreator && !isAreaOwner) {
    res.status(403).json({ error: "No tenés permiso para eliminar este evento" });
    return;
  }

  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
