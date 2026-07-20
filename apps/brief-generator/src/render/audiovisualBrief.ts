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

const COLOR_TEXTO = "000000";
const FONT = "Arial";
const FOOTER =
  "Si necesitás una reunión para pensar la estrategia de comunicación en conjunto, el equipo está disponible para agendar una llamada.";

function run(
  text: string,
  opts: { bold?: boolean; size?: number; italics?: boolean } = {}
): TextRun {
  return new TextRun({
    text,
    font: FONT,
    color: COLOR_TEXTO,
    size: opts.size ?? 22,
    bold: opts.bold,
    italics: opts.italics,
  });
}

function paragraph(
  children: TextRun[],
  opts: Partial<IParagraphOptions> = {}
): Paragraph {
  return new Paragraph({
    children,
    spacing: { before: 0, after: 120 },
    ...opts,
  });
}

function centeredBold(text: string, size = 28): Paragraph {
  return paragraph([run(text, { bold: true, size })], { alignment: "center" });
}

/** Solo se incluye si hay valor con contenido. */
function fieldLineIf(label: string, value?: string | null): Paragraph | null {
  if (!hasContent(value)) return null;
  return paragraph(
    [run(label, { bold: true }), run(` ${value!.trim()}`)],
    { alignment: "both" }
  );
}

function fieldLabelOnly(label: string, hint?: string): Paragraph {
  const text = hint ? `${label} ${hint}` : label;
  return paragraph([run(text, { bold: true })], { alignment: "both" });
}

export function buildAudiovisualBriefDocument(input: BriefInput): Document {
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
  const tituloDoc = hasContent(data.nombreProyecto)
    ? data.nombreProyecto
    : event.titulo || "Evento";

  const body: (Paragraph | null)[] = [
    fieldLineIf("Nombre del proyecto:", data.nombreProyecto),
    // Línea fija del modelo (coordinación, no responde el formulario)
    fieldLabelOnly(
      "Fecha estimada de entrega",
      "(a coordinar con el equipo audiovisual)"
    ),
    fieldLineIf("Sinopsis del proyecto:", data.sinopsis),
    fieldLineIf(
      "¿Qué querés comunicar? (objetivo principal del contenido):",
      data.objetivoComunicacion
    ),
    fieldLineIf(
      "¿Por qué canal va a salir? (Instagram, LinkedIn, mailing, etc.):",
      data.canal
    ),
    fieldLineIf("Duración aproximada:", data.duracion),
    fieldLineIf(
      "Formato (historia, reel, carrusel, video, etc.) + orientación (horizontal o vertical):",
      data.formato
    ),
    fieldLineIf("Lugar:", data.lugar),
    fieldLineIf("Fecha:", data.fecha),
    fieldLineIf("Hora:", data.hora),
    fieldLineIf(
      "Contacto del referente operativo de la DG/área que solicita:",
      data.contactoDg
    ),
    fieldLineIf("Contacto del referente del lugar:", data.contactoLugar),
  ];

  const children: FileChild[] = [
    centeredBold("BRIEF", 32),
    centeredBold("PEDIDO DE PIEZAS DE COMUNICACIÓN", 24),
    centeredBold("Y/O COBERTURA DE EVENTO", 24),
    paragraph(
      [
        run(
          "Respondé estas preguntas para que el Equipo Audiovisual pueda acompañarte de la mejor manera:",
          { bold: true }
        ),
      ],
      { alignment: "both", spacing: { before: 200, after: 200 } }
    ),
    ...body.filter((p): p is Paragraph => p != null),
    paragraph([run(FOOTER, { bold: true })], {
      alignment: "both",
      spacing: { before: 360, after: 0 },
    }),
  ];

  return new Document({
    sections: [{ children }],
    title: `Brief - ${tituloDoc}`,
    creator: "Sistema de Gestión de Eventos",
  });
}
