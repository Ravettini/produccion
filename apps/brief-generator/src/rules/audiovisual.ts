import type { BriefInput } from "../schemas/index.js";
import { trimOrNull, formatFechaBriefModelo, formatHoraBriefModelo } from "../normalize/index.js";
import { resolveLugar, type ApprovedProposal } from "./index.js";

/** Valor vacío: no se muestra en el brief (solo se incluyen respuestas con contenido). */
const EMPTY = "";

export type AudiovisualBriefData = {
  nombreProyecto: string;
  fechaEntrega: string;
  sinopsis: string;
  objetivoComunicacion: string;
  canal: string;
  duracion: string;
  formato: string;
  lugar: string;
  fecha: string;
  hora: string;
  contactoDg: string;
  contactoLugar: string;
};

function hasContent(value?: string | null): boolean {
  const v = (value ?? "").trim();
  return v !== "" && v !== "Por confirmar";
}

function pickField(sources: Record<string, unknown>[], key: string): string | null {
  for (const src of sources) {
    const v = src[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

function parseEventDatos(event: BriefInput["event"]): Record<string, unknown> {
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

function proposalDatosSources(approved: ApprovedProposal[]): Record<string, unknown>[] {
  return approved
    .filter((p) => p.categoria === "PRODUCCION")
    .map((p) => p.datosExtra ?? {});
}

function computeDurationFromHorarios(ini?: string | null, fin?: string | null): string | null {
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

export function buildAudiovisualBriefData(
  event: BriefInput["event"],
  approved: ApprovedProposal[]
): AudiovisualBriefData {
  const eventDatos = parseEventDatos(event);
  const sources = [eventDatos, ...proposalDatosSources(approved)];

  const titulo = trimOrNull(event.titulo) ?? EMPTY;
  const programa = trimOrNull((event as { programa?: string | null }).programa);
  const nombreProyecto = programa && titulo ? `"${titulo}" ${programa}` : titulo;

  const ini = pickField(sources, "horarioComienzo");
  const fin = pickField(sources, "horarioFinalizacion");
  const duracionExplicita = pickField(sources, "coberturaDuracion");
  const duracion = duracionExplicita ?? computeDurationFromHorarios(ini, fin) ?? EMPTY;

  const formatoBase =
    pickField(sources, "coberturaFormato") ??
    pickField(sources, "comunicacionPieza");
  const orientacion = pickField(sources, "coberturaOrientacion");
  let formato = formatoBase ?? EMPTY;
  if (formatoBase && orientacion) {
    formato = `${formatoBase} — orientación ${orientacion}`;
  }

  const usuario = trimOrNull(event.usuarioSolicitante);
  const area = trimOrNull(event.areaSolicitante);
  const contactoDgExplicito = pickField(sources, "coberturaContactoDg");
  let contactoDg = EMPTY;
  if (contactoDgExplicito) {
    contactoDg = contactoDgExplicito;
  } else if (usuario && area) {
    contactoDg = `${usuario} (${area})`;
  } else if (usuario) {
    contactoDg = usuario;
  } else if (area) {
    contactoDg = area;
  }

  const lugarEvento = trimOrNull((event as { lugar?: string | null }).lugar);
  const lugarResolved = lugarEvento ?? resolveLugar(approved);
  const lugar =
    hasContent(lugarResolved) && lugarResolved !== "Por confirmar"
      ? lugarResolved
      : EMPTY;

  const horaIni = pickField(sources, "horarioComienzo");

  // Sinopsis = resumen generado con IA (si no hay, no se inventa con la descripción)
  const resumen = trimOrNull((event as { resumen?: string | null }).resumen);

  return {
    nombreProyecto,
    fechaEntrega: EMPTY,
    sinopsis: resumen ?? EMPTY,
    objetivoComunicacion:
      pickField(sources, "coberturaObjetivo") ??
      pickField(sources, "comunicacionMensajeClave") ??
      EMPTY,
    canal: pickField(sources, "comunicacionMedio") ?? EMPTY,
    duracion,
    formato,
    lugar,
    fecha: event.fechaTentativa ? formatFechaBriefModelo(event.fechaTentativa) : EMPTY,
    hora: horaIni ? `${formatHoraBriefModelo(horaIni)} (Hora de inicio)` : EMPTY,
    contactoDg,
    contactoLugar: pickField(sources, "referenteLugarContacto") ?? EMPTY,
  };
}

export { hasContent };

/** Texto plano del brief: solo líneas con contenido. */
export function buildAudiovisualBriefText(data: AudiovisualBriefData): string {
  const lineas: string[] = [
    "BRIEF — PEDIDO DE PIEZAS DE COMUNICACIÓN Y/O COBERTURA DE EVENTO",
    "",
  ];
  if (hasContent(data.nombreProyecto)) {
    lineas.push(`Nombre del proyecto: ${data.nombreProyecto}`);
  }
  lineas.push("Fecha estimada de entrega (a coordinar con el equipo audiovisual)");
  if (hasContent(data.sinopsis)) {
    lineas.push(`Sinopsis del proyecto: ${data.sinopsis}`);
  }
  if (hasContent(data.objetivoComunicacion)) {
    lineas.push(`¿Qué querés comunicar?: ${data.objetivoComunicacion}`);
  }
  if (hasContent(data.canal)) {
    lineas.push(`¿Por qué canal va a salir?: ${data.canal}`);
  }
  if (hasContent(data.duracion)) {
    lineas.push(`Duración aproximada: ${data.duracion}`);
  }
  if (hasContent(data.formato)) {
    lineas.push(`Formato: ${data.formato}`);
  }
  if (hasContent(data.lugar)) lineas.push(`Lugar: ${data.lugar}`);
  if (hasContent(data.fecha)) lineas.push(`Fecha: ${data.fecha}`);
  if (hasContent(data.hora)) lineas.push(`Hora: ${data.hora}`);
  if (hasContent(data.contactoDg)) {
    lineas.push(`Contacto referente DG/área: ${data.contactoDg}`);
  }
  if (hasContent(data.contactoLugar)) {
    lineas.push(`Contacto referente del lugar: ${data.contactoLugar}`);
  }
  return lineas.join("\n");
}
