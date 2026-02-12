import { api } from "./client";
import type { Proposal, ProposalComment } from "../types";

export async function listProposals(eventId: string): Promise<Proposal[]> {
  return api<Proposal[]>(`/events/${eventId}/proposals`);
}

export async function getProposal(id: string): Promise<Proposal> {
  return api<Proposal>(`/proposals/${id}`);
}

export async function createProposal(
  eventId: string,
  data: {
    titulo: string;
    nombreProyecto?: string;
    descripcion: string;
    categoria?: string;
    impacto?: string;
    datosExtra?: Record<string, string>;
  }
): Promise<Proposal> {
  return api<Proposal>(`/events/${eventId}/proposals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProposal(id: string, data: Partial<Proposal>): Promise<Proposal> {
  return api<Proposal>(`/proposals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function submitProposal(id: string): Promise<Proposal> {
  return api<Proposal>(`/proposals/${id}/submit`, { method: "POST" });
}

export async function approveProposal(id: string): Promise<Proposal> {
  return api<Proposal>(`/proposals/${id}/approve`, { method: "POST" });
}

export async function rejectProposal(id: string, decisionReason: string): Promise<Proposal> {
  return api<Proposal>(`/proposals/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ decisionReason }),
  });
}

export async function cancelProposal(id: string): Promise<Proposal> {
  return api<Proposal>(`/proposals/${id}/cancel`, { method: "POST" });
}

export async function listComments(proposalId: string): Promise<ProposalComment[]> {
  return api<ProposalComment[]>(`/proposals/${proposalId}/comments`);
}

export async function addComment(proposalId: string, body: string): Promise<ProposalComment> {
  return api<ProposalComment>(`/proposals/${proposalId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
