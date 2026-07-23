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

const BROAD_ROLES = new Set([
  "ADMIN",
  "DIRECTOR_GENERAL",
  "VALIDADOR",
  "ORGANIZACION",
]);

export type ProposalChangeHint = {
  id: string;
  categoria: string;
  titulo?: string | null;
  updatedAt: string;
  createdAt?: string;
};

/** ¿Este requerimiento le importa al rol? */
export function proposalRelevantToRole(
  role: string | undefined | null,
  proposal: { categoria: string; titulo?: string | null }
): boolean {
  if (!role || BROAD_ROLES.has(role)) return true;
  if (role === "PRODUCCION") {
    return ["PRODUCCION", "CATERING", "TECNICA", "LOGISTICA"].includes(proposal.categoria);
  }
  if (role === "INSTITUCIONALES" || role === "AGENDA") {
    return proposal.categoria === "AGENDA";
  }
  if (role === "COBERTURA") {
    return (
      proposal.categoria === "OTRO" &&
      String(proposal.titulo ?? "")
        .toLowerCase()
        .includes("cobertura")
    );
  }
  return true;
}

/**
 * Aviso de cambios del evento filtrado por rol:
 * - Admin / organización: evento o cualquier requerimiento
 * - Especialidad: solo requerimientos de su área
 */
export function hasEventUnseenChangesForUser(
  role: string | undefined | null,
  event: { id: string; updatedAt: string; createdAt?: string },
  proposals: ProposalChangeHint[] = []
): boolean {
  const relevant = proposals.filter((p) => proposalRelevantToRole(role, p));
  const proposalChanged = relevant.some((p) =>
    hasUnseenChanges("proposal", p.id, p.updatedAt, p.createdAt)
  );
  if (proposalChanged) return true;

  if (!role || BROAD_ROLES.has(role)) {
    return hasUnseenChanges("event", event.id, event.updatedAt, event.createdAt);
  }
  // Especialidad: no avisar por updates genéricos del evento (ej. sync Acreditapp)
  return false;
}

export const modalidadLabels: Record<string, string> = {
  INTERNO: "Interno",
  EXTERNO: "Externo",
  PAGO: "Pago",
};
