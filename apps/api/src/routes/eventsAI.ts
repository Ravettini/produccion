/**
 * POST /events/:id/generar-brief-ia - Genera un brief redactado con IA (Google/Gemma)
 * GET  /events/:id/exportar-brief-docx - Exporta brief como DOCX (formato BRIEF ESTRATÉGICO)
 */
import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateBriefDocx } from "brief-generator";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { getAIConfig } from "../lib/config.js";

export const eventsAIRouter = Router();

/** GET /events/:id/exportar-brief-docx - Devuelve DOCX con formato BRIEF ESTRATÉGICO */
eventsAIRouter.get("/:id/exportar-brief-docx", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      proposals: {
        where: { estado: "APPROVED" },
        orderBy: { updatedAt: "asc" },
      },
    },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }

  const requiere = typeof event.tipoEvento === "string"
    ? event.tipoEvento.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const input = {
    event: {
      titulo: event.titulo,
      descripcion: event.descripcion,
      requiere,
      areaSolicitante: event.areaSolicitante,
      usuarioSolicitante: event.usuarioSolicitante,
      publico: event.publico as "EXTERNO" | "INTERNO" | "MIXTO" | null,
      fechaTentativa: event.fechaTentativa.toISOString().slice(0, 10),
      estado: event.estado,
      lugar: event.lugar ?? undefined,
      programa: event.programa ?? undefined,
      funcionario: event.funcionario ?? undefined,
      datosProduccion: event.datosProduccion
        ? (typeof event.datosProduccion === "string" ? (() => { try { return JSON.parse(event.datosProduccion as string); } catch { return undefined; } })() : event.datosProduccion)
        : undefined,
    },
    proposals: event.proposals.map((p) => ({
      status: "APPROVED" as const,
      categoria: p.categoria,
      titulo: p.titulo,
      nombreProyecto: p.nombreProyecto,
      descripcion: p.descripcion,
      impacto: p.impacto,
      datosExtra: (() => {
        try {
          return (p.datosExtra ? JSON.parse(p.datosExtra) : {}) as Record<string, unknown>;
        } catch {
          return {};
        }
      })(),
    })),
  };

  try {
    const buffer = await generateBriefDocx(input);
    const filename = `Brief - ${event.titulo.replace(/[/\\:*?"<>|]/g, "-")}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Error al generar el documento",
      detail: message,
    });
  }
});

eventsAIRouter.post("/:id/generar-brief-ia", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      proposals: {
        where: { estado: "APPROVED" },
        orderBy: { updatedAt: "asc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }

  const { apiKey, model } = await getAIConfig();
  if (!apiKey) {
    res.status(503).json({
      error: "IA no configurada. Agregá GOOGLE_AI_API_KEY en apps/api/.env (obtené la key en https://aistudio.google.com/apikey)",
    });
    return;
  }

  const eventInfo = [
    `Título: ${event.titulo}`,
    `Descripción: ${event.descripcion}`,
    `Requiere (según checkboxes): ${event.tipoEvento}`,
    `Área solicitante: ${event.areaSolicitante}`,
    `Usuario solicitante: ${event.usuarioSolicitante ?? "—"}`,
    `Público: ${event.publico === "EXTERNO" ? "Externo" : event.publico === "INTERNO" ? "Interno" : event.publico === "MIXTO" ? "Mixto" : "—"}`,
    `Fecha tentativa: ${event.fechaTentativa.toISOString().slice(0, 10)}`,
    `Estado: ${event.estado}`,
  ].join("\n");

  const aprobadas =
    event.proposals.length === 0
      ? "Ninguna propuesta aprobada aún."
      : event.proposals
          .map(
            (p) =>
              `- [${p.categoria}] ${p.titulo}${p.nombreProyecto ? ` (Proyecto: ${p.nombreProyecto})` : ""}: ${p.descripcion} (impacto ${p.impacto})`
          )
          .join("\n");

  const prompt = `Eres un redactor institucional. A partir de la información del evento y de las propuestas ya aprobadas, redactá un brief en prosa (párrafo o párrafos) que resuma cómo queda el evento. Incluí explícitamente lo que el evento REQUIERE según los checkboxes (Producción, Institucionales, Cobertura), el público (externo/interno/mixto), dónde se hace, qué se necesita según lo aprobado. Lenguaje claro y formal. En español.

--- INFORMACIÓN DEL EVENTO ---
${eventInfo}

--- PROPUESTAS APROBADAS ---
${aprobadas}

--- BRIEF REDACTADO ---`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({ model });
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    if (!text) {
      res.status(502).json({ error: "La IA no devolvió texto" });
      return;
    }
    res.json({ brief: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: "Error al generar el brief con IA",
      detail: message,
    });
  }
});
