import type { EventStatus, ProposalStatus, ProposalCategory, ProposalImpact, Role } from "../types";

export const eventStatusLabels: Record<EventStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_ANALISIS: "En análisis",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  REALIZADO: "Realizado",
};

export const eventStatusColors: Record<EventStatus, string> = {
  PENDIENTE: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  EN_ANALISIS: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  CONFIRMADO: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  CANCELADO: "bg-red-50 text-red-800 ring-1 ring-red-200",
  REALIZADO: "bg-brand-50 text-brand-800 ring-1 ring-brand-200",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Enviado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
};

export const proposalStatusColors: Record<ProposalStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  SUBMITTED: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-800 ring-1 ring-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

export const categoryLabels: Record<ProposalCategory, string> = {
  LOGISTICA: "Logística",
  CATERING: "Catering",
  TECNICA: "Técnica",
  AGENDA: "Agenda",
  PRODUCCION: "Producción",
  OTRO: "Otro",
};

export const categoryColors: Record<ProposalCategory, string> = {
  LOGISTICA: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  CATERING: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  TECNICA: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  AGENDA: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  PRODUCCION: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  OTRO: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export const impactLabels: Record<ProposalImpact, string> = {
  ALTO: "Alto",
  MEDIO: "Medio",
  BAJO: "Bajo",
};

export const impactColors: Record<ProposalImpact, string> = {
  ALTO: "bg-red-50 text-red-700 ring-1 ring-red-200",
  MEDIO: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  BAJO: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  DIRECTOR_GENERAL: "Director General",
  VALIDADOR: "Validador",
  ORGANIZACION: "Organización",
  PRODUCCION: "Producción",
  AGENDA: "Agenda",
};

export const roleColors: Record<Role, string> = {
  ADMIN: "bg-violet-50 text-violet-800 ring-1 ring-violet-200",
  DIRECTOR_GENERAL: "bg-brand-50 text-brand-800 ring-1 ring-brand-200",
  VALIDADOR: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  ORGANIZACION: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  PRODUCCION: "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
  AGENDA: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
};
