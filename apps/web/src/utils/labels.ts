import type { EventStatus, ProposalStatus, ProposalCategory, Role } from "../types";

export const eventStatusLabels: Record<EventStatus, string> = {
  BORRADOR: "Borrador",
  EN_ANALISIS: "En análisis",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  REALIZADO: "Realizado",
};

export const eventStatusColors: Record<EventStatus, string> = {
  BORRADOR: "bg-slate-200 text-slate-800",
  EN_ANALISIS: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-red-100 text-red-800",
  REALIZADO: "bg-blue-100 text-blue-800",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};

export const proposalStatusColors: Record<ProposalStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  SUBMITTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export const categoryLabels: Record<ProposalCategory, string> = {
  LOGISTICA: "Logística",
  CATERING: "Catering",
  TECNICA: "Técnica",
  AGENDA: "Agenda",
  PRODUCCION: "Producción",
  OTRO: "Otro",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  DIRECTOR_GENERAL: "Director General",
  VALIDADOR: "Validador",
  ORGANIZACION: "Organización",
  PRODUCCION: "Producción",
  AGENDA: "Agenda",
};
