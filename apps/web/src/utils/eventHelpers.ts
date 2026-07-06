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
