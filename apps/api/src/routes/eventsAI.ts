/**
 * POST /events/:id/generar-brief-ia - Genera sinopsis con IA, la guarda y deja listo el brief
 * GET  /events/:id/exportar-brief-docx - Exporta brief DOCX (modelo audiovisual)
 * GET  /events/:id/exportar-brief-ac-docx - Brief reducido para AC
 */
import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateBriefDocx, generateAcBriefReducidoDocx } from "brief-generator";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { getAIConfig } from "../lib/config.js";

export const eventsAIRouter = Router();

function buildBriefInput(event: {
  titulo: string;
  descripcion: string;
  tipoEvento: string;
  areaSolicitante: string;
  usuarioSolicitante: string | null;
  publico: string | null;
  fechaTentativa: Date;
  estado: string;
  lugar: string | null;
  programa: string | null;
  funcionario: string | null;
  productor?: string | null;
  resumen?: string | null;
  datosProduccion: unknown;
  proposals: Array<{
    categoria: string;
    titulo: string;
    nombreProyecto: string | null;
    descripcion: string;
    impacto: string;
    datosExtra: string | null;
  }>;
}) {
  const requiere =
    typeof event.tipoEvento === "string"
      ? event.tipoEvento.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return {
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
      productor: event.productor ?? undefined,
      resumen: event.resumen ?? undefined,
      datosProduccion: event.datosProduccion
        ? typeof event.datosProduccion === "string"
          ? (() => {
              try {
                return JSON.parse(event.datosProduccion as string);
              } catch {
                return undefined;
              }
            })()
          : event.datosProduccion
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
}

async function loadEventForBrief(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      proposals: {
        where: { estado: "APPROVED" },
        orderBy: { updatedAt: "asc" },
      },
    },
  });
}

/** GET /events/:id/exportar-brief-docx - Devuelve DOCX según modelo BRIEF AUDIOVISUAL */
eventsAIRouter.get("/:id/exportar-brief-docx", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const event = await loadEventForBrief(id);
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }

  try {
    const buffer = await generateBriefDocx(buildBriefInput(event));
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

/** GET /events/:id/exportar-brief-ac-docx - Brief reducido para AC */
eventsAIRouter.get("/:id/exportar-brief-ac-docx", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const event = await loadEventForBrief(id);
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }

  try {
    const buffer = await generateAcBriefReducidoDocx(buildBriefInput(event));
    const filename = `Brief reducido AC - ${event.titulo.replace(/[/\\:*?"<>|]/g, "-")}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "Error al generar el brief reducido AC",
      detail: message,
    });
  }
});

/** Quita preámbulos meta que a veces agrega el modelo ("Aquí tenés…", títulos, etc.). */
function cleanSinopsis(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```(?:\w+)?\s*|\s*```$/g, "").trim();
  text = text.replace(/^\*\*[^*]+\*\*\s*/g, "").trim();

  const metaLine =
    /^(aquí\s+ten[eé]s|aquí\s+tienes|te\s+presento|propuesta\s+de\s+redacci[oó]n|a\s+continuaci[oó]n|brief\s+de\s+evento)\b[^\n]*\n+/i;
  text = text.replace(metaLine, "").trim();

  const metaPrefix =
    /^(aquí\s+ten[eé]s|aquí\s+tienes|te\s+presento|propuesta\s+de\s+redacci[oó]n)[^.!?\n]*[.!:]\s*/i;
  text = text.replace(metaPrefix, "").trim();

  text = text.replace(/^brief\s+de\s+evento\s*:\s*[^\n]+\n+/i, "").trim();
  return text;
}

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
      error:
        "IA no configurada. Agregá GOOGLE_AI_API_KEY en apps/api/.env (obtené la key en https://aistudio.google.com/apikey)",
    });
    return;
  }

  let datosProduccionTxt = "—";
  if (event.datosProduccion) {
    try {
      const parsed =
        typeof event.datosProduccion === "string"
          ? JSON.parse(event.datosProduccion)
          : event.datosProduccion;
      datosProduccionTxt = JSON.stringify(parsed);
    } catch {
      datosProduccionTxt = String(event.datosProduccion);
    }
  }

  const eventInfo = [
    `Título: ${event.titulo}`,
    `Descripción: ${event.descripcion}`,
    `Requiere (según checkboxes): ${event.tipoEvento}`,
    `Área solicitante: ${event.areaSolicitante}`,
    `Usuario solicitante: ${event.usuarioSolicitante ?? "—"}`,
    `Productor: ${(event as { productor?: string | null }).productor ?? "—"}`,
    `Público: ${event.publico === "EXTERNO" ? "Externo" : event.publico === "INTERNO" ? "Interno" : event.publico === "MIXTO" ? "Mixto" : "—"}`,
    `Fecha tentativa: ${event.fechaTentativa.toISOString().slice(0, 10)}`,
    `Lugar: ${event.lugar ?? "—"}`,
    `Programa: ${event.programa ?? "—"}`,
    `Funcionario: ${event.funcionario ?? "—"}`,
    `Estado: ${event.estado}`,
    `Datos de producción / cobertura: ${datosProduccionTxt}`,
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

  const prompt = `Sos un redactor institucional. Redactá ÚNICAMENTE la sinopsis del proyecto en prosa formal (1 a 3 párrafos cortos).

Reglas estrictas:
- Empezá directo con el contenido. Sin saludos, sin títulos, sin encabezados.
- NO escribas frases meta como "Aquí tenés", "Aquí tienes", "Propuesta de redacción", "Brief de Evento:", "A continuación".
- NO uses markdown ni negritas.
- Incluí, si están disponibles: qué requiere el evento (Producción, Institucionales, Cobertura), público, fecha, lugar y lo aprobado en propuestas.
- Lenguaje claro, formal y en español.

--- INFORMACIÓN DEL EVENTO ---
${eventInfo}

--- PROPUESTAS APROBADAS ---
${aprobadas}

--- SINOPSIS ---`;

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

    const sinopsis = cleanSinopsis(text);
    if (!sinopsis) {
      res.status(502).json({ error: "La IA no devolvió una sinopsis válida" });
      return;
    }

    // La sinopsis queda guardada para el DOCX (campo Sinopsis del proyecto)
    await prisma.event.update({
      where: { id },
      data: { resumen: sinopsis },
    });

    res.json({ brief: sinopsis, saved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: "Error al generar el brief con IA",
      detail: message,
    });
  }
});
