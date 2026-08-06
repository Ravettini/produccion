import type { User, Proposal, Event } from "../types";

const PROPOSAL_CREATOR_ROLES = [
  "ORGANIZACION",
  "PRODUCCION",
  "AGENDA",
  "INSTITUCIONALES",
  "COBERTURA",
  "ADMIN",
];

/** Quién puede cargar eventos nuevos (incl. Institucionales / Nacho cuando las DG no cargan). */
const EVENT_CREATOR_ROLES = [
  "ORGANIZACION",
  "ADMIN",
  "DIRECTOR_GENERAL",
  "INSTITUCIONALES",
  "AGENDA",
];

const SPECIALTY_ROLES = ["PRODUCCION", "INSTITUCIONALES", "AGENDA", "COBERTURA"];

/** Categorías de requerimiento que cada especialidad puede aprobar/rechazar. */
const PROPOSAL_VALIDATE_BY_ROLE: Record<string, string[]> = {
  ADMIN: ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"],
  VALIDADOR: ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"],
  PRODUCCION: ["PRODUCCION", "CATERING", "TECNICA", "LOGISTICA"],
  INSTITUCIONALES: ["AGENDA"],
  AGENDA: ["AGENDA"],
  COBERTURA: ["OTRO"],
};

export function canCreateProposal(user: User | null): boolean {
  return user !== null && PROPOSAL_CREATOR_ROLES.includes(user.role);
}

/** Quién puede abrir la carga de un evento nuevo (solicitantes / admin / institucionales). */
export function canCreateEvent(user: User | null): boolean {
  return user !== null && EVENT_CREATOR_ROLES.includes(user.role);
}

export function isSpecialtyRole(user: User | null): boolean {
  return user !== null && SPECIALTY_ROLES.includes(user.role);
}

export function canApproveOrRejectProposal(
  user: User | null,
  proposal?: { categoria?: string; titulo?: string | null } | null
): boolean {
  if (!user) return false;
  const allowed = PROPOSAL_VALIDATE_BY_ROLE[user.role];
  if (!allowed) return false;
  if (!proposal?.categoria) return user.role === "ADMIN" || user.role === "VALIDADOR";
  if (!allowed.includes(proposal.categoria)) return false;
  if (user.role === "COBERTURA" && proposal.categoria === "OTRO") {
    return String(proposal.titulo ?? "")
      .toLowerCase()
      .includes("cobertura");
  }
  return true;
}

export function canConfirmEvent(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function canEditEvent(user: User | null, event: { createdById?: string | null }): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (!event.createdById) return true;
  return event.createdById === user.id;
}

/** Especialidad puede corregir campos del evento (ej. funcionario) si le fue solicitado. */
export function canSpecialtyEditEventFields(user: User | null, canDecide: boolean): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return isSpecialtyRole(user) && canDecide;
}

export function canDeleteEvent(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function canEditProposal(
  user: User | null,
  proposal: Proposal,
  opts?: { specialtyCanEdit?: boolean }
): boolean {
  if (!user) return false;
  if (proposal.estado === "CANCELLED") return false;
  if (user.role === "ADMIN") return true;
  if (opts?.specialtyCanEdit && isSpecialtyRole(user)) return true;
  if (proposal.estado !== "DRAFT") return false;
  return proposal.createdById === user.id;
}

export function canSubmitProposal(user: User | null, proposal: Proposal): boolean {
  if (!user) return false;
  if (proposal.estado !== "DRAFT") return false;
  return proposal.createdById === user.id || user.role === "ADMIN";
}

export function canCancelProposal(user: User | null, proposal: Proposal): boolean {
  if (!user) return false;
  if (["APPROVED", "REJECTED", "CANCELLED"].includes(proposal.estado)) return false;
  return proposal.createdById === user.id || user.role === "ADMIN";
}

export type { Event };
