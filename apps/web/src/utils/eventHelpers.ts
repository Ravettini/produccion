import type { Event } from "../types";

export function parseDatosProduccion(
  dp: Event["datosProduccion"]
): Record<string, string> {
  if (dp == null) return {};
  if (typeof dp === "string") {
    try {
      const parsed = JSON.parse(dp) as Record<string, string>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(
    Object.entries(dp).map(([k, v]) => [k, v != null ? String(v) : ""])
  );
}

/** Horario para tarjetas y calendario: convocatoria · comienzo · finalización */
export function getEventHorario(event: Event): string {
  const dp = parseDatosProduccion(event.datosProduccion);
  const conv = dp.horarioConvocatoria?.trim();
  const ini = dp.horarioComienzo?.trim();
  const fin = dp.horarioFinalizacion?.trim();
  if (conv && ini && fin) return `${conv} · ${ini} – ${fin}`;
  if (ini && fin) return `${ini} – ${fin}`;
  if (ini) return ini;
  return "Sin horario";
}

/**
 * Minutos desde 00:00 del horario de comienzo del evento (o convocatoria).
 * Sin horario → al final del día (para ordenar temprano → tarde).
 */
export function getEventStartMinutes(event: Event): number {
  const dp = parseDatosProduccion(event.datosProduccion);
  const raw = (dp.horarioComienzo || dp.horarioConvocatoria || "").trim();
  if (!raw) return 24 * 60 + 1;
  const withMin = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (withMin) {
    const h = Number(withMin[1]);
    const m = Number(withMin[2]);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
  }
  const onlyHour = raw.match(/(\d{1,2})\s*hs?/i);
  if (onlyHour) {
    const h = Number(onlyHour[1]);
    if (Number.isFinite(h)) return h * 60;
  }
  return 24 * 60 + 1;
}

export function compareEventsByStartTime(a: Event, b: Event): number {
  const diff = getEventStartMinutes(a) - getEventStartMinutes(b);
  if (diff !== 0) return diff;
  return (a.titulo || "").localeCompare(b.titulo || "", "es");
}

/** Fondos claritos por área (DG) para el calendario. */
const AREA_PASTEL_CLASSES = [
  "bg-sky-100 border-sky-200",
  "bg-emerald-100 border-emerald-200",
  "bg-violet-100 border-violet-200",
  "bg-amber-100 border-amber-200",
  "bg-rose-100 border-rose-200",
  "bg-cyan-100 border-cyan-200",
  "bg-lime-100 border-lime-200",
  "bg-fuchsia-100 border-fuchsia-200",
  "bg-orange-100 border-orange-200",
  "bg-teal-100 border-teal-200",
  "bg-indigo-100 border-indigo-200",
  "bg-pink-100 border-pink-200",
  "bg-yellow-100 border-yellow-200",
  "bg-blue-100 border-blue-200",
  "bg-green-100 border-green-200",
] as const;

export function getAreaPastelClass(area: string | null | undefined): string {
  const key = (area ?? "").trim() || "Sin área";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AREA_PASTEL_CLASSES[hash % AREA_PASTEL_CLASSES.length]!;
}

export function getCantidadPersonas(event: Event): number | null {
  const dp = parseDatosProduccion(event.datosProduccion);
  const n = parseInt(dp.cantidadPersonas ?? "", 10);
  return !Number.isNaN(n) && n > 0 ? n : null;
}

/** Filtro calendario: tipo de pedido (Producción, Institucionales, Cobertura) */
export function eventMatchesTipoFilter(tipoEvento: string, filter: string): boolean {
  if (!filter) return true;
  const partes = tipoEvento.split(",").map((s) => s.trim().toLowerCase());
  const f = filter.toLowerCase();
  if (f === "cobertura") return partes.some((p) => p.includes("cobertura") || p.includes("comunicación"));
  if (f === "institucionales") return partes.some((p) => p.includes("institucional"));
  if (f === "produccion") return partes.some((p) => p.includes("producción") || p.includes("produccion"));
  return true;
}
