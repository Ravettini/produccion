/**
 * Rutas solo para ADMIN: listar y gestionar usuarios.
 */
import { Router } from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";

export const adminRouter = Router();

const validRoles = ["ADMIN", "DIRECTOR_GENERAL", "ORGANIZACION", "PRODUCCION", "AGENDA", "VALIDADOR"];

adminRouter.use(authMiddleware);
adminRouter.use(requireRoles("ADMIN"));

/**
 * GET /admin/metrics - Métricas del sistema (eventos, propuestas, tendencias).
 */
const AREAS_REQUIERE = ["Producción", "Institucionales", "Cobertura"];
const CATEGORIAS = ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"];

function getMesAnio(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

adminRouter.get("/metrics", async (_req, res) => {
  const now = new Date();
  const inicioMesActual = new Date(now.getFullYear(), now.getMonth(), 1);
  const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const finMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    eventCounts,
    proposalCounts,
    proposalByCat,
    proposalByImpact,
    totalEvents,
    totalProposals,
    allEvents,
    allProposals,
    eventsWithResumen,
    approvedProposals,
  ] = await Promise.all([
    prisma.event.groupBy({ by: ["estado"], _count: { id: true } }),
    prisma.proposal.groupBy({ by: ["estado"], _count: { id: true } }),
    prisma.proposal.groupBy({ by: ["categoria"], _count: { id: true } }),
    prisma.proposal.groupBy({ by: ["impacto"], _count: { id: true } }),
    prisma.event.count(),
    prisma.proposal.count(),
    prisma.event.findMany({
      select: {
        tipoEvento: true,
        areaSolicitante: true,
        publico: true,
        resumen: true,
        createdAt: true,
        updatedAt: true,
        estado: true,
        id: true,
      },
    }),
    prisma.proposal.findMany({
      select: {
        estado: true,
        categoria: true,
        createdAt: true,
        updatedAt: true,
        validatedById: true,
        validatedBy: { select: { name: true } },
        eventId: true,
      },
    }),
    prisma.event.count({ where: { resumen: { not: null } } }),
    prisma.proposal.findMany({
      where: { estado: "APPROVED" },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);

  const eventsByStatus = Object.fromEntries(
    eventCounts.map((e) => [e.estado, e._count.id])
  ) as Record<string, number>;
  const proposalsByStatus = Object.fromEntries(
    proposalCounts.map((p) => [p.estado, p._count.id])
  ) as Record<string, number>;
  const proposalsByCategory = Object.fromEntries(
    proposalByCat.map((p) => [p.categoria, p._count.id])
  ) as Record<string, number>;
  const proposalsByImpact = Object.fromEntries(
    proposalByImpact.map((p) => [p.impacto, p._count.id])
  ) as Record<string, number>;

  const eventosPorRequerimiento: Record<string, number> = {};
  for (const area of AREAS_REQUIERE) eventosPorRequerimiento[area] = 0;
  const normalize = (s: string) => s.toLowerCase().replace(/ó/g, "o").replace(/í/g, "i");
  for (const e of allEvents) {
    const partes = (e.tipoEvento ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    for (const area of AREAS_REQUIERE) {
      const areaNorm = normalize(area);
      if (partes.some((p) => normalize(p) === areaNorm || normalize(p).includes(areaNorm))) {
        eventosPorRequerimiento[area]++;
      }
    }
  }

  const eventosPorAreaSolicitante: Record<string, number> = {};
  for (const e of allEvents) {
    const area = e.areaSolicitante?.trim() || "Sin área";
    eventosPorAreaSolicitante[area] = (eventosPorAreaSolicitante[area] ?? 0) + 1;
  }

  const eventosPorPublico: Record<string, number> = { EXTERNO: 0, INTERNO: 0, MIXTO: 0 };
  for (const e of allEvents) {
    const p = e.publico || "Sin definir";
    if (eventosPorPublico[p] !== undefined) eventosPorPublico[p]++;
    else eventosPorPublico["Sin definir"] = (eventosPorPublico["Sin definir"] ?? 0) + 1;
  }

  const eventosPorMes: Record<string, number> = {};
  for (const e of allEvents) {
    const mes = getMesAnio(e.createdAt);
    eventosPorMes[mes] = (eventosPorMes[mes] ?? 0) + 1;
  }

  const confirmados = eventsByStatus.CONFIRMADO ?? 0;
  const cancelados = eventsByStatus.CANCELADO ?? 0;
  const totalConResolucion = confirmados + cancelados;
  const tasaConversion = totalConResolucion > 0
    ? Math.round((confirmados / totalConResolucion) * 100)
    : 0;

  const eventosSinPropuestasAprobadas = allEvents.filter((ev) => {
    const aprobadasDelEvento = allProposals.filter(
      (p) => p.eventId === ev.id && p.estado === "APPROVED"
    );
    return aprobadasDelEvento.length === 0;
  }).length;

  const propuestasPendientes =
    (proposalsByStatus.DRAFT ?? 0) + (proposalsByStatus.SUBMITTED ?? 0);

  const eventosConfirmadosEsteMes = allEvents.filter(
    (e) =>
      e.estado === "CONFIRMADO" &&
      e.updatedAt >= inicioMesActual
  ).length;
  const eventosConfirmadosMesAnterior = allEvents.filter(
    (e) =>
      e.estado === "CONFIRMADO" &&
      e.updatedAt >= inicioMesAnterior &&
      e.updatedAt <= finMesAnterior
  ).length;

  const tiemposAprobacion = approvedProposals.map((p) =>
    (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const tiempoPromedioAprobacionDias =
    tiemposAprobacion.length > 0
      ? Math.round(
          (tiemposAprobacion.reduce((a, b) => a + b, 0) / tiemposAprobacion.length) * 10
        ) / 10
      : null;

  const totalEvaluadas =
    (proposalsByStatus.APPROVED ?? 0) + (proposalsByStatus.REJECTED ?? 0);
  const tasaRechazo =
    totalEvaluadas > 0
      ? Math.round(((proposalsByStatus.REJECTED ?? 0) / totalEvaluadas) * 100)
      : 0;

  const propuestasPorValidador: Record<string, number> = {};
  for (const p of allProposals) {
    if (p.estado === "APPROVED" && p.validatedBy) {
      const name = p.validatedBy.name || "Sin nombre";
      propuestasPorValidador[name] = (propuestasPorValidador[name] ?? 0) + 1;
    }
  }

  const evolucionEventos: { mes: string; cantidad: number }[] = [];
  const evolucionPropuestas: { mes: string; cantidad: number }[] = [];
  const mesesRecientes: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    mesesRecientes.push(getMesAnio(d));
  }
  for (const mes of mesesRecientes) {
    evolucionEventos.push({
      mes,
      cantidad: allEvents.filter((e) => getMesAnio(e.createdAt) === mes).length,
    });
    evolucionPropuestas.push({
      mes,
      cantidad: allProposals.filter((p) => getMesAnio(p.createdAt) === mes).length,
    });
  }

  res.json({
    totalEvents,
    totalProposals,
    eventsByStatus: {
      BORRADOR: eventsByStatus.BORRADOR ?? 0,
      EN_ANALISIS: eventsByStatus.EN_ANALISIS ?? 0,
      CONFIRMADO: eventsByStatus.CONFIRMADO ?? 0,
      CANCELADO: eventsByStatus.CANCELADO ?? 0,
    },
    proposalsByStatus: {
      DRAFT: proposalsByStatus.DRAFT ?? 0,
      SUBMITTED: proposalsByStatus.SUBMITTED ?? 0,
      APPROVED: proposalsByStatus.APPROVED ?? 0,
      REJECTED: proposalsByStatus.REJECTED ?? 0,
      CANCELLED: proposalsByStatus.CANCELLED ?? 0,
    },
    eventosPorRequerimiento,
    eventosPorAreaSolicitante,
    eventosPorPublico,
    eventosPorMes,
    tasaConversion,
    eventosSinPropuestasAprobadas,
    eventosConBrief: eventsWithResumen,
    propuestasPendientes,
    eventosConfirmadosEsteMes,
    eventosConfirmadosMesAnterior,
    tiempoPromedioAprobacionDias,
    tasaRechazo,
    proposalsByCategory: Object.fromEntries(
      CATEGORIAS.map((c) => [c, proposalsByCategory[c] ?? 0])
    ),
    proposalsByImpact: {
      ALTO: proposalsByImpact.ALTO ?? 0,
      MEDIO: proposalsByImpact.MEDIO ?? 0,
      BAJO: proposalsByImpact.BAJO ?? 0,
    },
    propuestasPorValidador,
    evolucionEventos,
    evolucionPropuestas,
  });
});

/**
 * POST /admin/cargar-json - Cargar eventos desde JSON.
 * Body: { eventos: [{ titulo, descripcion, tipoEvento, areaSolicitante, fechaTentativa, estado?, resumen? }, ...] }
 * O directamente un array de eventos.
 */
adminRouter.post("/cargar-json", async (req, res) => {
  let payload = req.body;
  if (!Array.isArray(payload)) {
    payload = payload?.eventos ?? [];
  }
  if (!Array.isArray(payload) || payload.length === 0) {
    res.status(400).json({ error: "Se espera un array de eventos en el body" });
    return;
  }
  const validStatuses = ["BORRADOR", "EN_ANALISIS", "CONFIRMADO", "CANCELADO"];
  const normalizeArea = (a: unknown) => {
    const s = String(a ?? "").trim();
    if (!s || s.toLowerCase() === "nan" || s === "null") return "Sin área";
    return s;
  };
  const created: { id: string; titulo: string }[] = [];
  const errors: { index: number; error: string }[] = [];
  for (let i = 0; i < payload.length; i++) {
    const e = payload[i];
    const titulo = String(e?.titulo ?? "").trim();
    const descripcion = String(e?.descripcion ?? "").trim();
    const tipoEvento = String(e?.tipoEvento ?? "INSTITUCIONAL").trim();
    const areaSolicitante = normalizeArea(e?.areaSolicitante);
    const fechaStr = e?.fechaTentativa;
    if (!titulo || !descripcion || !fechaStr) {
      errors.push({ index: i, error: "Faltan titulo, descripcion o fechaTentativa" });
      continue;
    }
    let fechaTentativa: Date;
    try {
      fechaTentativa = new Date(fechaStr);
      if (isNaN(fechaTentativa.getTime())) throw new Error("Fecha inválida");
    } catch {
      errors.push({ index: i, error: "fechaTentativa inválida" });
      continue;
    }
    const estado = validStatuses.includes(String(e?.estado ?? "")) ? String(e.estado) : "BORRADOR";
    const resumen = e?.resumen != null && String(e.resumen).trim() !== "" ? String(e.resumen) : null;
    try {
      const event = await prisma.event.create({
        data: {
          titulo,
          descripcion,
          tipoEvento,
          areaSolicitante,
          fechaTentativa,
          estado,
          resumen,
          usuarioSolicitante: null,
          publico: null,
        },
      });
      created.push({ id: event.id, titulo: event.titulo });
    } catch (err) {
      errors.push({ index: i, error: (err as Error).message });
    }
  }
  res.json({
    ok: true,
    creados: created.length,
    errores: errors.length,
    detalle: created,
    erroresDetalle: errors,
  });
});

/**
 * POST /admin/vaciar - Vaciar toda la app: elimina eventos, propuestas, adjuntos.
 * Los usuarios se mantienen. Solo ADMIN.
 */
adminRouter.post("/vaciar", async (_req, res) => {
  const UPLOADS_DIR = path.join(process.cwd(), "uploads", "events");
  try {
    await prisma.event.deleteMany();
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.rmSync(UPLOADS_DIR, { recursive: true });
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    res.json({ ok: true, message: "App vaciada correctamente" });
  } catch (err) {
    console.error("Error al vaciar app:", err);
    res.status(500).json({ error: "Error al vaciar la base de datos" });
  }
});

/**
 * GET /admin/users - Listado de todos los usuarios (sin password).
 */
adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, area: true, createdAt: true },
  });
  res.json(users);
});

/**
 * PUT /admin/users/:id - Actualizar usuario (name, role, area, opcionalmente password).
 * Body: { name?, role?, area?, password? }
 */
adminRouter.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, area, password } = req.body ?? {};
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  const data: { name?: string; role?: string; area?: string | null; password?: string } = {};
  if (name !== undefined) data.name = String(name).trim();
  if (role !== undefined) {
    if (!validRoles.includes(String(role))) {
      res.status(400).json({ error: "Rol inválido" });
      return;
    }
    data.role = String(role);
  }
  if (area !== undefined) data.area = String(area).trim() || null;
  if (password !== undefined && String(password).trim() !== "") {
    data.password = await bcrypt.hash(String(password), 10);
  }
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Nada que actualizar" });
    return;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: data as Parameters<typeof prisma.user.update>[0]["data"],
    select: { id: true, email: true, name: true, role: true, area: true, createdAt: true },
  });
  res.json(updated);
});

/**
 * DELETE /admin/users/:id - Eliminar usuario (no se puede eliminar a uno mismo).
 */
adminRouter.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    res.status(400).json({ error: "No podés eliminarte a vos mismo" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
});

/**
 * GET /admin/config/ai - Configuración IA (sin exponer la key). Solo indica si está configurada y el modelo.
 */
adminRouter.get("/config/ai", async (_req, res) => {
  const { getAIConfig } = await import("../lib/config.js");
  const { apiKey, model } = await getAIConfig();
  res.json({ configured: !!apiKey, model });
});

/**
 * PUT /admin/config/ai - Guardar API key y/o modelo de Google AI (Gemma, etc.).
 * Body: { apiKey?, model? }
 */
adminRouter.put("/config/ai", async (req, res) => {
  const { setAIConfig, getAIConfig } = await import("../lib/config.js");
  const { apiKey, model } = req.body ?? {};
  const updates: { apiKey?: string; model?: string } = {};
  if (apiKey !== undefined) updates.apiKey = String(apiKey).trim();
  if (model !== undefined) updates.model = String(model).trim();
  if (Object.keys(updates).length > 0) await setAIConfig(updates);
  const cfg = await getAIConfig();
  res.json({ configured: !!cfg.apiKey, model: cfg.model });
});
