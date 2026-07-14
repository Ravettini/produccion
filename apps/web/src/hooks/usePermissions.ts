import type { User, Proposal, Event } from "../types";

const PROPOSAL_CREATOR_ROLES = [
  "ORGANIZACION",
  "PRODUCCION",
  "AGENDA",
  "INSTITUCIONALES",
  "COBERTURA",
  "ADMIN",
];

const EVENT_CREATOR_ROLES = ["ORGANIZACION", "ADMIN", "DIRECTOR_GENERAL"];

const SPECIALTY_ROLES = ["PRODUCCION", "INSTITUCIONALES", "AGENDA", "COBERTURA"];

export function canCreateProposal(user: User | null): boolean {
  return user !== null && PROPOSAL_CREATOR_ROLES.includes(user.role);
}

/** Quién puede abrir la carga de un evento nuevo (solicitantes / admin). */
export function canCreateEvent(user: User | null): boolean {
  return user !== null && EVENT_CREATOR_ROLES.includes(user.role);
}

export function isSpecialtyRole(user: User | null): boolean {
  return user !== null && SPECIALTY_ROLES.includes(user.role);
}

export function canApproveOrRejectProposal(user: User | null): boolean {
  return user?.role === "ADMIN";
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
