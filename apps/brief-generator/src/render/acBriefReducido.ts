/**
 * Brief reducido para AC (Área de Comunicación / cobertura operativa).
 * Formato corto: solo campos con contenido. Fuente Arial.
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
import { buildAudiovisualBriefData, hasContent } from "../rules/audiovisual.js";

const COLOR = "000000";
const FONT = "Arial";

function run(
  text: string,
  opts: { bold?: boolean; size?: number; italics?: boolean } = {}
): TextRun {
  return new TextRun({
    text,
    font: FONT,
    color: COLOR,
    size: opts.size ?? 22,
    bold: opts.bold,
    italics: opts.italics,
  });
}

function p(children: TextRun[], opts: Partial<IParagraphOptions> = {}): Paragraph {
  return new Paragraph({
    children,
    spacing: { before: 0, after: 100 },
    ...opts,
  });
}

function title(text: string, size = 28): Paragraph {
  return p([run(text, { bold: true, size })], { alignment: "center" });
}

function lineIf(label: string, value?: string | null): Paragraph | null {
  if (!hasContent(value)) return null;
  return p(
    [run(`${label} `, { bold: true }), run(value!.trim())],
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
  const requiereList = (event as { requiere?: string[] }).requiere;
  const requiere =
    (Array.isArray(requiereList) && requiereList.length > 0
      ? requiereList.join(", ")
      : null) ||
    (event as { tipoEvento?: string }).tipoEvento ||
    "";
  const tituloDoc = hasContent(data.nombreProyecto)
    ? data.nombreProyecto
    : event.titulo || "Evento";

  const body: (Paragraph | null)[] = [
    lineIf("Nombre del proyecto:", data.nombreProyecto),
    lineIf("Fecha:", data.fecha),
    lineIf("Hora:", data.hora),
    lineIf("Lugar:", data.lugar),
    lineIf("Sinopsis:", data.sinopsis),
    lineIf("Qué requiere:", requiere),
    lineIf("Contacto DG/área:", data.contactoDg),
    lineIf("Contacto del lugar:", data.contactoLugar),
    lineIf("Productor:", productor),
  ];

  const children: FileChild[] = [
    title("BRIEF REDUCIDO — AC", 32),
    title("Área de Comunicación / Cobertura", 22),
    p(
      [
        run("Resumen operativo del evento (formato corto).", {
          italics: true,
          size: 20,
        }),
      ],
      { alignment: "center", spacing: { before: 120, after: 240 } }
    ),
    ...body.filter((x): x is Paragraph => x != null),
    p(
      [
        run("Fecha estimada de entrega (a coordinar con el equipo audiovisual)", {
          bold: true,
        }),
      ],
      { spacing: { before: 200, after: 0 } }
    ),
  ];

  return new Document({
    sections: [{ children }],
    title: `Brief reducido AC - ${tituloDoc}`,
    creator: "Sistema de Gestión de Eventos",
  });
}
