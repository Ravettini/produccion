/**
 * fechaTentativa es un día civil (sin hora). Se guarda como DateTime a mediodía UTC
 * para que la zona del servidor (p. ej. Argentina GMT-3) no lo corra al día anterior
 * al escribir un TIMESTAMP WITHOUT TIME ZONE.
 */

export function parseFechaTentativa(value: unknown): Date {
  const raw = value instanceof Date ? value.toISOString() : String(value ?? "");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return parsed;
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return new Date(`${y}-${m}-${d}T12:00:00.000Z`);
}

/** Día civil YYYY-MM-DD a partir de lo guardado o de un string ISO. */
export function civilDateFromStored(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  // Medianoche UTC leída en GMT-3 a veces vuelve como 21:00 del día anterior.
  // Si la hora UTC es >= 21, el día civil real es el siguiente.
  const shifted = date.getUTCHours() >= 21 ? new Date(date.getTime() + 3 * 60 * 60 * 1000) : date;
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayBoundsFromCivil(civil: string): { start: Date; end: Date } {
  return {
    start: new Date(`${civil}T00:00:00.000Z`),
    end: new Date(`${civil}T23:59:59.999Z`),
  };
}

/** Serializa un evento para la API: fechaTentativa siempre como YYYY-MM-DD. */
export function serializeEventFecha<T extends { fechaTentativa?: unknown }>(
  event: T
): T & { fechaTentativa: string } {
  return {
    ...event,
    fechaTentativa: civilDateFromStored(event.fechaTentativa),
  };
}
