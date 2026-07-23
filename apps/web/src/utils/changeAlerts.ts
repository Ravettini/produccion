/** Alertas visuales de cambios: último visto por usuario en localStorage. */

const EVENT_PREFIX = "evento-visto:";
const PROPOSAL_PREFIX = "requerimiento-visto:";

function key(prefix: string, id: string): string {
  return `${prefix}${id}`;
}

export function getLastSeen(prefix: "event" | "proposal", id: string): string | null {
  try {
    return localStorage.getItem(key(prefix === "event" ? EVENT_PREFIX : PROPOSAL_PREFIX, id));
  } catch {
    return null;
  }
}

export function markSeen(prefix: "event" | "proposal", id: string, at?: string): void {
  try {
    localStorage.setItem(
      key(prefix === "event" ? EVENT_PREFIX : PROPOSAL_PREFIX, id),
      at ?? new Date().toISOString()
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Hay cambios solo si el usuario ya vio el ítem y luego se actualizó. */
export function hasUnseenChanges(
  prefix: "event" | "proposal",
  id: string,
  updatedAt: string,
  _createdAt?: string
): boolean {
  const last = getLastSeen(prefix, id);
  if (!last) return false;
  const u = new Date(updatedAt).getTime();
  const l = new Date(last).getTime();
  if (!Number.isFinite(u) || !Number.isFinite(l)) return false;
  return u > l + 500;
}

export const modalidadLabels: Record<string, string> = {
  INTERNO: "Interno",
  EXTERNO: "Externo",
  PAGO: "Pago",
};
