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

const COLOR_TEXTO = "000000";
const FOOTER =
  "Si necesitás una reunión para pensar la estrategia de comunicación en conjunto, el equipo está disponible para agendar una llamada.";

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
  return paragraph(
    [new TextRun({ text, bold: true, color: COLOR_TEXTO, size })],
    { alignment: "center" }
  );
}

function fieldLine(label: string, value?: string): Paragraph {
  const runs: TextRun[] = [
    new TextRun({ text: label, bold: true, color: COLOR_TEXTO, size: 22 }),
  ];
  if (value != null && value.trim() !== "") {
    runs.push(new TextRun({ text: ` ${value}`, color: COLOR_TEXTO, size: 22 }));
  }
  return paragraph(runs, { alignment: "both" });
}

function fieldLabelOnly(label: string, hint?: string): Paragraph {
  const text = hint ? `${label} ${hint}` : label;
  return paragraph(
    [new TextRun({ text, bold: true, color: COLOR_TEXTO, size: 22 })],
    { alignment: "both" }
  );
}

function fieldWithFallback(label: string, hint: string, value: string): Paragraph {
  const display = value && value !== "Por confirmar" ? value : "";
  if (display) {
    return fieldLine(`${label} ${hint}`, display);
  }
  return fieldLabelOnly(`${label} ${hint}`);
}

export function buildAudiovisualBriefDocument(input: BriefInput): Document {
  const normalized = normalizeInput(input);
  let approved = filterApproved(normalized.proposals);
  const event = normalized.event;
  const eventDatos = (event as { datosProduccion?: Record<string, unknown> | null }).datosProduccion;
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
  const tituloDoc = data.nombreProyecto !== "Por confirmar" ? data.nombreProyecto : event.titulo || "Evento";

  const children: FileChild[] = [
    centeredBold("BRIEF", 32),
    centeredBold("PEDIDO DE PIEZAS DE COMUNICACIÓN", 24),
    centeredBold("Y/O COBERTURA DE EVENTO", 24),
    paragraph(
      [
        new TextRun({
          text: "Respondé estas preguntas para que el Equipo Audiovisual pueda acompañarte de la mejor manera:",
          bold: true,
          color: COLOR_TEXTO,
          size: 22,
        }),
      ],
      { alignment: "both", spacing: { before: 200, after: 200 } }
    ),
    fieldLine("Nombre del proyecto:", data.nombreProyecto),
    data.fechaEntrega !== "Por confirmar"
      ? fieldLine(
          "Fecha estimada de entrega",
          `${data.fechaEntrega} (a coordinar con el equipo audiovisual)`
        )
      : fieldLabelOnly(
          "Fecha estimada de entrega",
          "(a coordinar con el equipo audiovisual)"
        ),
    fieldLine("Sinopsis del proyecto:", data.sinopsis),
    fieldWithFallback(
      "¿Qué querés comunicar?",
      "(objetivo principal del contenido)",
      data.objetivoComunicacion
    ),
    fieldWithFallback(
      "¿Por qué canal va a salir?",
      "(Instagram, LinkedIn, mailing, etc.)",
      data.canal
    ),
    data.duracion !== "Por confirmar"
      ? fieldLine("Duración aproximada", data.duracion)
      : fieldLabelOnly("Duración aproximada"),
    data.formato !== "Por confirmar"
      ? fieldLine(
          "Formato (historia, reel, carrusel, video, etc.) + orientación (horizontal o vertical):",
          data.formato
        )
      : fieldLabelOnly(
          "Formato",
          "(historia, reel, carrusel, video, etc.) + orientación (horizontal o vertical)"
        ),
    fieldLine("Lugar:", data.lugar),
    fieldLine("Fecha:", data.fecha),
    fieldLine("Hora:", data.hora),
    fieldLine(
      "Contacto del referente operativo de la DG/área que solicita:",
      data.contactoDg !== "Por confirmar" ? data.contactoDg : undefined
    ),
    fieldLine(
      "Contacto del referente del lugar:",
      data.contactoLugar !== "Por confirmar" ? data.contactoLugar : undefined
    ),
    paragraph(
      [
        new TextRun({
          text: FOOTER,
          bold: true,
          color: COLOR_TEXTO,
          size: 22,
        }),
      ],
      { alignment: "both", spacing: { before: 360, after: 0 } }
    ),
  ];

  return new Document({
    sections: [{ children }],
    title: `Brief - ${tituloDoc}`,
    creator: "Sistema de Gestión de Eventos",
  });
}
