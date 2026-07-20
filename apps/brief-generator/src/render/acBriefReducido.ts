/**
 * Brief reducido para AC (Área de Comunicación).
 * Formato corto: datos básicos, dinámica, descripción breve, Cobertura/Producción SI|NO.
 * Fuente Arial. Sin detalle de producción ni audiovisual.
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
import {
  formatFechaBriefModelo,
  formatHoraBriefModelo,
  trimOrNull,
} from "../normalize/index.js";
import { hasContent } from "../rules/audiovisual.js";

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

function sectionTitle(text: string): Paragraph {
  return p([run(text, { bold: true, size: 24 })], {
    spacing: { before: 240, after: 120 },
  });
}

function lineIf(label: string, value?: string | null): Paragraph | null {
  if (!hasContent(value)) return null;
  return p(
    [run(`${label} `, { bold: true }), run(value!.trim())],
    { alignment: "both" }
  );
}

function bodyText(text: string): Paragraph {
  return p([run(text.trim())], { alignment: "both", spacing: { before: 0, after: 120 } });
}

function siNoLine(label: string, value: boolean): Paragraph {
  return p(
    [run(`${label}: `, { bold: true }), run(value ? "SI" : "NO")],
    { spacing: { before: 80, after: 80 } }
  );
}

function parseDatos(event: BriefInput["event"]): Record<string, unknown> {
  const raw = (event as { datosProduccion?: unknown }).datosProduccion;
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function pick(datos: Record<string, unknown>, key: string): string | null {
  const v = datos[key];
  if (v == null || String(v).trim() === "") return null;
  return String(v).trim();
}

function computeDuration(ini?: string | null, fin?: string | null): string | null {
  if (!ini || !fin) return null;
  const parse = (t: string) => {
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  };
  const a = parse(ini);
  const b = parse(fin);
  if (a == null || b == null || b <= a) return null;
  const mins = b - a;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

function requiereFlags(event: BriefInput["event"]): {
  cobertura: boolean;
  produccion: boolean;
} {
  const list = (event as { requiere?: string[] }).requiere;
  const fromList = Array.isArray(list) ? list : [];
  const fromTipo =
    typeof (event as { tipoEvento?: string }).tipoEvento === "string"
      ? String((event as { tipoEvento?: string }).tipoEvento)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const all = [...fromList, ...fromTipo].map((s) => s.toLowerCase());
  return {
    cobertura: all.some((s) => s.includes("cobertura")),
    produccion: all.some((s) => s.includes("producci")),
  };
}

export function buildAcBriefReducidoDocument(input: BriefInput): Document {
  const normalized = normalizeInput(input);
  const event = normalized.event;
  const datos = parseDatos(event);
  const flags = requiereFlags(event);

  const titulo = trimOrNull(event.titulo) ?? "Evento";
  const fecha = event.fechaTentativa
    ? formatFechaBriefModelo(event.fechaTentativa)
    : null;
  const horaIni = pick(datos, "horarioComienzo");
  const horaFin = pick(datos, "horarioFinalizacion");
  const hora = horaIni
    ? horaFin
      ? `${formatHoraBriefModelo(horaIni)} – ${formatHoraBriefModelo(horaFin)}`
      : formatHoraBriefModelo(horaIni)
    : null;
  const duracion =
    pick(datos, "coberturaDuracion") ??
    computeDuration(horaIni, horaFin);
  const lugar = trimOrNull((event as { lugar?: string | null }).lugar);
  const area = trimOrNull(event.areaSolicitante);
  const funcionario = trimOrNull((event as { funcionario?: string | null }).funcionario);
  const usuario = trimOrNull(event.usuarioSolicitante);

  const resumen = trimOrNull((event as { resumen?: string | null }).resumen);
  const descripcion = trimOrNull(event.descripcion);

  // Breve descripción = sinopsis IA si hay; si no, la descripción del formulario
  const breveDescripcion = resumen ?? descripcion;
  // Dinámica = descripción del formulario cuando hay sinopsis aparte; si no, no se duplica
  const dinamica = resumen && descripcion && descripcion !== resumen ? descripcion : null;

  const basicos: (Paragraph | null)[] = [
    lineIf("Fecha:", fecha),
    lineIf("Hora:", hora),
    lineIf("Locación:", lugar),
    lineIf("Duración:", duracion),
    lineIf("Área solicitante:", area),
    lineIf("Responsable:", usuario),
    lineIf("Participantes / funcionarios:", funcionario),
  ];

  const children: FileChild[] = [
    title("ACTIVIDAD", 32),
    title(titulo, 26),
    p(
      [run("Brief reducido — AC", { italics: true, size: 20 })],
      { alignment: "center", spacing: { before: 40, after: 200 } }
    ),

    sectionTitle("Datos básicos"),
    ...basicos.filter((x): x is Paragraph => x != null),

    ...(hasContent(breveDescripcion)
      ? [sectionTitle("Breve descripción del evento"), bodyText(breveDescripcion!)]
      : []),

    ...(hasContent(dinamica)
      ? [sectionTitle("Dinámica"), bodyText(dinamica!)]
      : []),

    sectionTitle("Requerimientos"),
    siNoLine("Cobertura", flags.cobertura),
    siNoLine("Producción", flags.produccion),
  ];

  return new Document({
    sections: [{ children }],
    title: `Brief reducido AC - ${titulo}`,
    creator: "Sistema de Gestión de Eventos",
  });
}
