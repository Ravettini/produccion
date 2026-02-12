import type { User, Proposal } from "../types";

const PROPOSAL_CREATOR_ROLES = ["ORGANIZACION", "PRODUCCION", "AGENDA", "ADMIN"];

export function canCreateProposal(user: User | null): boolean {
  return user !== null && PROPOSAL_CREATOR_ROLES.includes(user.role);
}

export function canApproveOrRejectProposal(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function canConfirmEvent(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function canDeleteEvent(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function canEditProposal(user: User | null, proposal: Proposal): boolean {
  if (!user) return false;
  if (proposal.estado !== "DRAFT") return false;
  return proposal.createdById === user.id || user.role === "ADMIN";
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
