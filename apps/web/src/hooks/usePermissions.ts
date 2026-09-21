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

function specialtyIsRequestedOnEvent(
  role: string,
  event: { tipoEvento?: string | null; areaSolicitante?: string | null }
): boolean {
  if (event.areaSolicitante && /responsabilidad\s+social/i.test(event.areaSolicitante)) return false;
  if (/solo\s+informar/i.test(String(event.tipoEvento ?? ""))) return false;
  const keywordsByRole: Record<string, string[]> = {
    PRODUCCION: ["producción", "produccion"],
    INSTITUCIONALES: ["institucional"],
    AGENDA: ["institucional"],
    COBERTURA: ["cobertura", "comunicación", "comunicacion"],
  };
  const keywords = keywordsByRole[role];
  if (!keywords) return false;
  const partes = String(event.tipoEvento ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return keywords.some((kw) => partes.some((p) => p.includes(kw)));
}

export function canCreateProposal(
  user: User | null,
  event?: {
    tipoEvento?: string | null;
    areaSolicitante?: string | null;
    createdById?: string | null;
  } | null
): boolean {
  if (!user || !PROPOSAL_CREATOR_ROLES.includes(user.role)) return false;
  if (!event) return true;
  if (user.role === "ADMIN") return true;
  if (event.createdById && event.createdById === user.id) return true;
  if (SPECIALTY_ROLES.includes(user.role)) {
    return specialtyIsRequestedOnEvent(user.role, event);
  }
  if (user.role === "DIRECTOR_GENERAL" || user.role === "ORGANIZACION") {
    if (event.createdById && event.createdById === user.id) return true;
    return false;
  }
  return true;
}

/** Quién puede duplicar un evento existente (mismos roles que pueden crear). */
export function canCloneEvent(user: User | null): boolean {
  return canCreateEvent(user);
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

export function canEditEvent(
  user: User | null,
  event: { createdById?: string | null; areaSolicitante?: string | null }
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  // Especialidades (incl. Institucionales) solo editan si son creadoras; el resto es solo lectura.
  if (SPECIALTY_ROLES.includes(user.role)) {
    return Boolean(event.createdById && event.createdById === user.id);
  }
  if (event.createdById && event.createdById === user.id) return true;
  if (
    (user.role === "DIRECTOR_GENERAL" || user.role === "ORGANIZACION") &&
    user.area &&
    event.areaSolicitante &&
    user.area.toLowerCase() === event.areaSolicitante.toLowerCase()
  ) {
    return true;
  }
  // Eventos legacy sin creador: permite editar a roles no-especialidad.
  if (!event.createdById) return true;
  return false;
}

/** Especialidad puede corregir campos del evento (ej. funcionario) si le fue solicitado. */
export function canSpecialtyEditEventFields(user: User | null, canDecide: boolean): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return isSpecialtyRole(user) && canDecide;
}

export function canDeleteEvent(
  user: User | null,
  event?: { createdById?: string | null; areaSolicitante?: string | null } | null
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (!event) return false;
  if (event.createdById && event.createdById === user.id) return true;
  if (
    user.area &&
    event.areaSolicitante &&
    user.area.toLowerCase() === event.areaSolicitante.toLowerCase() &&
    (user.role === "DIRECTOR_GENERAL" || user.role === "ORGANIZACION")
  ) {
    return true;
  }
  return false;
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
