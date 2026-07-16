import type { BriefInput } from "../schemas/index.js";
import { trimOrNull, formatFechaBriefModelo, formatHoraBriefModelo } from "../normalize/index.js";
import { resolveValue, resolveLugar, type ApprovedProposal } from "./index.js";

const POR_CONFIRMAR = "Por confirmar";

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

  const titulo = trimOrNull(event.titulo) ?? POR_CONFIRMAR;
  const programa = trimOrNull((event as { programa?: string | null }).programa);
  const nombreProyecto = programa ? `"${titulo}" ${programa}` : titulo;

  const ini = pickField(sources, "horarioComienzo");
  const fin = pickField(sources, "horarioFinalizacion");
  const duracionExplicita = pickField(sources, "coberturaDuracion");
  const duracion =
    duracionExplicita ??
    computeDurationFromHorarios(ini, fin) ??
    POR_CONFIRMAR;

  const formatoBase =
    pickField(sources, "coberturaFormato") ??
    pickField(sources, "comunicacionPieza");
  const orientacion = pickField(sources, "coberturaOrientacion");
  let formato = formatoBase ?? POR_CONFIRMAR;
  if (formatoBase && orientacion) {
    formato = `${formatoBase} — orientación ${orientacion}`;
  }

  const usuario = trimOrNull(event.usuarioSolicitante);
  const area = trimOrNull(event.areaSolicitante);
  const contactoDgExplicito = pickField(sources, "coberturaContactoDg");
  let contactoDg = POR_CONFIRMAR;
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
  const horaIni = pickField(sources, "horarioComienzo");

  return {
    nombreProyecto,
    fechaEntrega: POR_CONFIRMAR,
    sinopsis: resolveValue(trimOrNull(event.descripcion)),
    objetivoComunicacion: resolveValue(
      pickField(sources, "coberturaObjetivo") ?? pickField(sources, "comunicacionMensajeClave")
    ),
    canal: resolveValue(pickField(sources, "comunicacionMedio")),
    duracion: resolveValue(duracion === POR_CONFIRMAR ? null : duracion),
    formato: resolveValue(formato === POR_CONFIRMAR ? null : formato),
    lugar: resolveValue(lugarEvento ?? resolveLugar(approved)),
    fecha: formatFechaBriefModelo(event.fechaTentativa),
    hora: horaIni ? `${formatHoraBriefModelo(horaIni)} (Hora de inicio)` : POR_CONFIRMAR,
    contactoDg,
    contactoLugar: resolveValue(pickField(sources, "referenteLugarContacto")),
  };
}

/** Texto plano del brief audiovisual (resumen automático en la API). */
export function buildAudiovisualBriefText(data: AudiovisualBriefData): string {
  const lineas = [
    "BRIEF — PEDIDO DE PIEZAS DE COMUNICACIÓN Y/O COBERTURA DE EVENTO",
    "",
    `Nombre del proyecto: ${data.nombreProyecto}`,
    "Fecha estimada de entrega (a coordinar con el equipo audiovisual)",
    `Sinopsis del proyecto: ${data.sinopsis}`,
    `¿Qué querés comunicar?: ${data.objetivoComunicacion}`,
    `¿Por qué canal va a salir?: ${data.canal}`,
    `Duración aproximada: ${data.duracion}`,
    `Formato: ${data.formato}`,
    `Lugar: ${data.lugar}`,
    `Fecha: ${data.fecha}`,
    `Hora: ${data.hora}`,
    `Contacto referente DG/área: ${data.contactoDg}`,
    `Contacto referente del lugar: ${data.contactoLugar}`,
  ];
  return lineas.join("\n");
}
