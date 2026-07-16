/**
 * Brief reducido para AC (Área de Comunicación / cobertura operativa).
 * Formato corto: datos clave del evento sin el cuestionario audiovisual completo.
 */
import {
  Document,
  Paragraph,
  TextRun,
  type FileChild,
  type IParagraphOptions,
} from "docx";
import type { BriefInput } from "../schemas/index.js";
import { normalizeInput } from "../normalize/index.js";
import { filterApproved, type ApprovedProposal } from "../rules/index.js";
import { buildAudiovisualBriefData } from "../rules/audiovisual.js";

const COLOR = "000000";

function p(children: TextRun[], opts: Partial<IParagraphOptions> = {}): Paragraph {
  return new Paragraph({
    children,
    spacing: { before: 0, after: 100 },
    ...opts,
  });
}

function title(text: string, size = 28): Paragraph {
  return p([new TextRun({ text, bold: true, color: COLOR, size })], {
    alignment: "center",
  });
}

function line(label: string, value: string): Paragraph {
  return p(
    [
      new TextRun({ text: `${label} `, bold: true, color: COLOR, size: 22 }),
      new TextRun({ text: value, color: COLOR, size: 22 }),
    ],
    { alignment: "both" }
  );
}

export function buildAcBriefReducidoDocument(input: BriefInput): Document {
  const normalized = normalizeInput(input);
  let approved = filterApproved(normalized.proposals);
  const event = normalized.event;
  const eventDatos = (event as { datosProduccion?: Record<string, unknown> | null })
    .datosProduccion;
  if (eventDatos && typeof eventDatos === "object" && Object.keys(eventDatos).length > 0) {
    const synthetic: ApprovedProposal = {
      categoria: "PRODUCCION",
      status: "APPROVED",
      titulo: "",
      descripcion: "",
      impacto: "MEDIO",
      datosExtra: eventDatos,
    };
    approved = [synthetic, ...approved];
  }

  const data = buildAudiovisualBriefData(event, approved);
  const productor = (event as { productor?: string | null }).productor?.trim();
  const requiere =
    (event as { requiere?: string[] }).requiere?.join(", ") ||
    (event as { tipoEvento?: string }).tipoEvento ||
    "Por confirmar";
  const tituloDoc =
    data.nombreProyecto !== "Por confirmar" ? data.nombreProyecto : event.titulo || "Evento";

  const children: FileChild[] = [
    title("BRIEF REDUCIDO — AC", 32),
    title("Área de Comunicación / Cobertura", 22),
    p(
      [
        new TextRun({
          text: "Resumen operativo del evento (formato corto).",
          italics: true,
          color: COLOR,
          size: 20,
        }),
      ],
      { alignment: "center", spacing: { before: 120, after: 240 } }
    ),
    line("Nombre del proyecto:", data.nombreProyecto),
    line("Fecha:", data.fecha),
    line("Hora:", data.hora),
    line("Lugar:", data.lugar),
    line("Sinopsis:", data.sinopsis),
    line("Qué requiere:", String(requiere)),
    line(
      "Contacto DG/área:",
      data.contactoDg !== "Por confirmar" ? data.contactoDg : "—"
    ),
    line(
      "Contacto del lugar:",
      data.contactoLugar !== "Por confirmar" ? data.contactoLugar : "—"
    ),
  ];

  if (productor) {
    children.push(line("Productor:", productor));
  }

  children.push(
    p(
      [
        new TextRun({
          text: "Fecha estimada de entrega (a coordinar con el equipo audiovisual)",
          bold: true,
          color: COLOR,
          size: 22,
        }),
      ],
      { spacing: { before: 200, after: 0 } }
    )
  );

  return new Document({
    sections: [{ children }],
    title: `Brief reducido AC - ${tituloDoc}`,
    creator: "Sistema de Gestión de Eventos",
  });
}
