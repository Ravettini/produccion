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

/** Ítem del feed unificado evento + requerimientos */
export interface EventActivityItem {
  id: string;
  source: "event" | "proposal";
  action: string;
  field?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  reason?: string | null;
  createdAt: string;
  user?: { id: string; name: string; role?: string };
  proposalId?: string | null;
  proposalTitulo?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
}

export interface EventAuditsResponse {
  items: EventActivityItem[];
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

export async function getEventAudits(eventId: string): Promise<EventAuditsResponse> {
  const data = await api<EventAuditsResponse | EventActivityItem[] | EventAuditEntry[]>(
    `/events/${eventId}/audits`
  );
  // Compat: respuestas viejas eran un array plano de EventAudit
  if (Array.isArray(data)) {
    return {
      items: data.map((a) => ({
        id: a.id,
        source: "event" as const,
        action: a.action,
        field: "field" in a ? a.field : null,
        fromValue: "fromValue" in a ? a.fromValue : null,
        toValue: "toValue" in a ? a.toValue : null,
        reason: a.reason,
        createdAt: a.createdAt,
        user: a.user,
        proposalId: null,
        proposalTitulo: null,
        fromStatus: null,
        toStatus: null,
      })),
    };
  }
  return data;
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
