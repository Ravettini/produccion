/** Alertas visuales de cambios: último visto por usuario en localStorage. */

const EVENT_PREFIX = "evento-visto:";
const PROPOSAL_PREFIX = "requerimiento-visto:";

/**
 * El "visto" es por usuario: si dos cuentas comparten el navegador no deben
 * heredar los avisos de la otra.
 */
let currentUserId: string | null = null;

export function setChangeAlertsUser(userId: string | null): void {
  currentUserId = userId?.trim() ? userId.trim() : null;
}

function key(prefix: string, id: string): string {
  return currentUserId ? `${prefix}${currentUserId}:${id}` : `${prefix}${id}`;
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

/** Margen para no contar como cambio el guardado inicial ni los relojes desfasados. */
const CREATION_GRACE_MS = 30_000;

/**
 * Hay cambios si el ítem se actualizó después de la última vez que el usuario
 * lo vio. Si nunca lo abrió, alcanza con que haya sido editado después de
 * crearse: así el aviso también funciona en la primera visita.
 */
export function hasUnseenChanges(
  prefix: "event" | "proposal",
  id: string,
  updatedAt: string,
  createdAt?: string
): boolean {
  const u = new Date(updatedAt).getTime();
  if (!Number.isFinite(u)) return false;

  const last = getLastSeen(prefix, id);
  if (!last) {
    if (!createdAt) return false;
    const c = new Date(createdAt).getTime();
    if (!Number.isFinite(c)) return false;
    return u > c + CREATION_GRACE_MS;
  }

  const l = new Date(last).getTime();
  if (!Number.isFinite(l)) return false;
  return u > l + 500;
}

const BROAD_ROLES = new Set([
  "ADMIN",
  "DIRECTOR_GENERAL",
  "VALIDADOR",
  "ORGANIZACION",
]);

/** Roles que aprueban o rechazan requerimientos. */
const VALIDATOR_ROLES = new Set(["ADMIN"]);

export type ProposalChangeHint = {
  id: string;
  categoria: string;
  titulo?: string | null;
  estado?: string | null;
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

/** Rol de área que le corresponde al usuario, o null si no es de especialidad. */
export function areaRoleForUser(role: string | undefined | null): string | null {
  if (role === "AGENDA") return "INSTITUCIONALES";
  if (role === "PRODUCCION" || role === "INSTITUCIONALES" || role === "COBERTURA") return role;
  return null;
}

export interface EventPendingForUser {
  /** Requerimientos enviados esperando validación (para quien valida). */
  porValidar: number;
  /** El área del usuario todavía no marcó su aprobación en el evento. */
  faltaMiAprobacion: boolean;
  /** Áreas involucradas que siguen sin decidir (para roles que ven todo). */
  areasPendientes: number;
  /** Requiere alguna acción de este usuario. */
  requiereAccion: boolean;
}

/**
 * Qué le falta hacer al usuario en este evento. A diferencia del aviso de
 * "cambios", esto surge del estado real y no de lo que ya vio.
 */
export function getEventPendingForUser(
  role: string | undefined | null,
  event: {
    proposals?: ProposalChangeHint[];
    areaChecklist?: { areaRole: string; estado: string }[];
  }
): EventPendingForUser {
  const proposals = event.proposals ?? [];
  const checklist = event.areaChecklist ?? [];

  const porValidar =
    role && VALIDATOR_ROLES.has(role)
      ? proposals.filter((p) => p.estado === "SUBMITTED").length
      : 0;

  const miArea = areaRoleForUser(role);
  const faltaMiAprobacion = miArea
    ? checklist.some((c) => c.areaRole === miArea && c.estado === "PENDING")
    : false;

  const areasPendientes = checklist.filter((c) => c.estado === "PENDING").length;

  return {
    porValidar,
    faltaMiAprobacion,
    areasPendientes,
    requiereAccion: porValidar > 0 || faltaMiAprobacion,
  };
}

export const modalidadLabels: Record<string, string> = {
  INTERNO: "Interno",
  EXTERNO: "Externo",
  PAGO: "Pago",
};
