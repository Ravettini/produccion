/** Formato de fecha para UI */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formato de fecha corto */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Día calendario (YYYY-MM-DD) de una fecha sin hora, como la fecha del evento.
 * Se lee del texto para que la zona horaria no corra el día.
 */
export function toCivilDateString(date: string | Date): string {
  if (typeof date === "string") {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  }
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Día de hoy en formato YYYY-MM-DD según la zona del navegador. */
export function todayCivilDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Fecha del evento: "30 de jul de 2026", sin corrimiento por zona horaria. */
export function formatEventDate(date: string | Date): string {
  const civil = toCivilDateString(date);
  if (!civil) return "—";
  return new Date(`${civil}T12:00:00.000Z`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Fecha del evento en formato 30/07/2026, sin corrimiento por zona horaria. */
export function formatEventDateShort(date: string | Date): string {
  const civil = toCivilDateString(date);
  if (!civil) return "—";
  return new Date(`${civil}T12:00:00.000Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
