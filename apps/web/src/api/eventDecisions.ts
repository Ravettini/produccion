import { api } from "./client";

export type AreaDecisionEstado = "PENDING" | "APPROVED" | "REJECTED";
export type AreaDecisionRole = "PRODUCCION" | "INSTITUCIONALES" | "COBERTURA";

export interface EventAreaDecision {
  id: string;
  eventId: string;
  areaRole: AreaDecisionRole | string;
  estado: AreaDecisionEstado | string;
  userId?: string | null;
  reason?: string | null;
  label?: string;
  user?: { id: string; name: string; role?: string } | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface AreaDecisionsResponse {
  requested: AreaDecisionRole[];
  decisions: EventAreaDecision[];
  myAreaRole: AreaDecisionRole | null;
  canDecide: boolean;
}

export interface EventAuditEntry {
  id: string;
  eventId: string;
  userId: string;
  action: string;
  field?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  reason?: string | null;
  createdAt: string;
  user?: { id: string; name: string; role?: string };
}

export async function getAreaDecisions(eventId: string): Promise<AreaDecisionsResponse> {
  return api<AreaDecisionsResponse>(`/events/${eventId}/area-decisions`);
}

export async function submitAreaDecision(
  eventId: string,
  data: { decision: "APPROVED" | "REJECTED"; reason?: string; areaRole?: string }
): Promise<EventAreaDecision> {
  return api<EventAreaDecision>(`/events/${eventId}/area-decisions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getEventAudits(eventId: string): Promise<EventAuditEntry[]> {
  return api<EventAuditEntry[]>(`/events/${eventId}/audits`);
}

export async function patchEventFields(
  eventId: string,
  fields: Record<string, string | null | undefined>,
  reason?: string
): Promise<unknown> {
  return api(`/events/${eventId}/fields`, {
    method: "PATCH",
    body: JSON.stringify({ fields, reason }),
  });
}
