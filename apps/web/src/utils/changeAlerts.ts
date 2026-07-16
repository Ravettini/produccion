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

/** Hay cambios si updatedAt es posterior al último visto (o nunca se vio). */
export function hasUnseenChanges(
  prefix: "event" | "proposal",
  id: string,
  updatedAt: string,
  createdAt?: string
): boolean {
  const last = getLastSeen(prefix, id);
  if (!last) {
    // Primera visita: no marcar "nuevo" si no hubo edición (mismo created/updated)
    if (createdAt && updatedAt) {
      const c = new Date(createdAt).getTime();
      const u = new Date(updatedAt).getTime();
      if (Number.isFinite(c) && Number.isFinite(u) && Math.abs(u - c) < 2000) return false;
    }
    return Boolean(createdAt && updatedAt && createdAt !== updatedAt);
  }
  return new Date(updatedAt).getTime() > new Date(last).getTime();
}

export const modalidadLabels: Record<string, string> = {
  INTERNO: "Interno",
  EXTERNO: "Externo",
  PAGO: "Pago",
};
