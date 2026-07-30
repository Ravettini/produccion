export type Role =
  | "ADMIN"
  | "DIRECTOR_GENERAL"
  | "ORGANIZACION"
  | "PRODUCCION"
  | "INSTITUCIONALES"
  | "AGENDA"
  | "COBERTURA"
  | "VALIDADOR";
export type EventStatus =
  | "PENDIENTE"
  | "EN_RADAR"
  | "EN_ANALISIS"
  | "CONFIRMADO"
  | "CANCELADO"
  | "REALIZADO";
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
  productor?: string | null;
  necesitaAcreditacion?: boolean | null;
  linkAcreditacionConvocados?: string | null;
  motivoCancelacion?: string | null;
  realizacionAsistentes?: number | null;
  realizacionImpacto?: string | null;
  realizacionLinkImpacto?: string | null;
  datosProduccion?: Record<string, unknown> | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { proposals: number };
  /** Resumen de requerimientos para avisos de cambios y pendientes por rol */
  proposals?: {
    id: string;
    categoria: ProposalCategory | string;
    titulo: string;
    estado?: ProposalStatus | string;
    updatedAt: string;
    createdAt: string;
  }[];
  /** Check de aprobación de las áreas involucradas */
  areaChecklist?: AreaChecklistItem[];
}

export type AreaDecisionRole = "PRODUCCION" | "INSTITUCIONALES" | "COBERTURA";
export type AreaDecisionEstado = "PENDING" | "APPROVED" | "REJECTED";

export interface AreaChecklistItem {
  areaRole: AreaDecisionRole | string;
  label: string;
  estado: AreaDecisionEstado | string;
  reason?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
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
