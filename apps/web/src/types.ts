export type Role = "ADMIN" | "DIRECTOR_GENERAL" | "ORGANIZACION" | "PRODUCCION" | "AGENDA" | "VALIDADOR";
export type EventStatus = "BORRADOR" | "EN_ANALISIS" | "CONFIRMADO" | "CANCELADO" | "REALIZADO";
export type ProposalCategory = "LOGISTICA" | "CATERING" | "TECNICA" | "AGENDA" | "PRODUCCION" | "OTRO";
export type ProposalImpact = "ALTO" | "MEDIO" | "BAJO";
export type ProposalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  area?: string | null;
}

export interface Event {
  id: string;
  titulo: string;
  descripcion: string;
  tipoEvento: string;
  areaSolicitante: string;
  fechaTentativa: string;
  estado: EventStatus;
  resumen?: string | null;
  usuarioSolicitante?: string | null;
  publico?: string | null;
  lugar?: string | null;
  programa?: string | null;
  funcionario?: string | null;
  necesitaAcreditacion?: boolean | null;
  linkAcreditacionConvocados?: string | null;
  motivoCancelacion?: string | null;
  realizacionAsistentes?: number | null;
  realizacionImpacto?: string | null;
  realizacionLinkImpacto?: string | null;
  datosProduccion?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: { proposals: number };
}

export interface Proposal {
  id: string;
  eventId: string;
  titulo: string;
  nombreProyecto?: string | null;
  descripcion: string;
  categoria: ProposalCategory;
  impacto: ProposalImpact;
  estado: ProposalStatus;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  validatedById?: string | null;
  validatedBy?: { id: string; name: string } | null;
  decisionReason?: string | null;
  datosExtra?: Record<string, string> | string | null;
  createdAt: string;
  updatedAt: string;
  event?: { id: string; titulo: string };
  comments?: ProposalComment[];
  audits?: ProposalAudit[];
}

export interface ProposalComment {
  id: string;
  proposalId: string;
  userId: string;
  user?: { id: string; name: string };
  body: string;
  createdAt: string;
}

export interface ProposalAudit {
  id: string;
  proposalId: string;
  userId: string;
  user?: { id: string; name: string };
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  reason?: string | null;
  createdAt: string;
}
