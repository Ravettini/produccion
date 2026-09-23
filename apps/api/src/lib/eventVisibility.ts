/**
 * Visibilidad de eventos por rol.
 * Los roles de área (Producción, Institucionales, Cobertura) solo ven
 * eventos donde se les solicitó apoyo en tipoEvento.
 */

export type EventVisibilityUser = {
  id: string;
  role: string;
  area?: string | null;
};

/** Roles que ven todos los eventos del sistema. */
export const ROLES_SEE_ALL = new Set([
  "ADMIN",
  "VALIDADOR",
]);

/**
 * Mapeo rol → keyword(s) del tipo de apoyo en Event.tipoEvento.
 * AGENDA se mantiene por compatibilidad (= Institucionales).
 */
const ROLE_TIPO_KEYWORDS: Record<string, string[]> = {
  PRODUCCION: ["producción", "produccion"],
  INSTITUCIONALES: ["institucional"],
  AGENDA: ["institucional"],
  COBERTURA: ["cobertura", "comunicación", "comunicacion"],
};

/** Roles de especialidad que responden a un tipo de apoyo. */
export const SPECIALTY_ROLES = [
  "PRODUCCION",
  "INSTITUCIONALES",
  "AGENDA",
  "COBERTURA",
] as const;

/** Roles canónicos usados en EventAreaDecision.areaRole */
export const AREA_DECISION_ROLES = ["PRODUCCION", "INSTITUCIONALES", "COBERTURA"] as const;
export type AreaDecisionRole = (typeof AREA_DECISION_ROLES)[number];

export function normalizeAreaRole(role: string): AreaDecisionRole | null {
  if (role === "AGENDA") return "INSTITUCIONALES";
  if ((AREA_DECISION_ROLES as readonly string[]).includes(role)) {
    return role as AreaDecisionRole;
  }
  return null;
}

/** Áreas solicitadas según tipoEvento del evento. */
export function getRequestedAreaRoles(
  tipoEvento: string | null | undefined,
  areaSolicitante?: string | null | undefined
): AreaDecisionRole[] {
  if (areaSolicitante && /responsabilidad\s+social/i.test(areaSolicitante)) {
    return [];
  }
  if (/solo\s+informar/i.test(String(tipoEvento ?? ""))) {
    return [];
  }
  const requested: AreaDecisionRole[] = [];
  for (const area of AREA_DECISION_ROLES) {
    const kws = ROLE_TIPO_KEYWORDS[area];
    if (kws && tipoEventoMatchesKeywords(tipoEvento, kws)) {
      requested.push(area);
    }
  }
  return requested;
}

export function isSpecialtyRole(role: string): boolean {
  return (SPECIALTY_ROLES as readonly string[]).includes(role);
}

/** ¿El rol del usuario es responsable del área solicitada en este evento? */
export function isUserResponsibleForEvent(
  user: EventVisibilityUser,
  event: { tipoEvento?: string | null; areaSolicitante?: string | null }
): boolean {
  const area = normalizeAreaRole(user.role);
  if (!area) return false;
  return getRequestedAreaRoles(event.tipoEvento, event.areaSolicitante).includes(area);
}

/** ¿Institucionales ya aprobó? (alcanza para aparecer en calendario). */
export function hasInstitucionalesApproved(event: {
  areaDecisions?: { areaRole?: string | null; estado?: string | null }[] | null;
}): boolean {
  const decisions = event.areaDecisions ?? [];
  return decisions.some(
    (d) =>
      (d.areaRole === "INSTITUCIONALES" || d.areaRole === "AGENDA") &&
      d.estado === "APPROVED"
  );
}

export function tipoEventoMatchesKeywords(
  tipoEvento: string | null | undefined,
  keywords: string[]
): boolean {
  const partes = String(tipoEvento ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return keywords.some((kw) => partes.some((p) => p.includes(kw)));
}

/** Keywords de tipo de apoyo asociadas al rol, o null si no aplica filtro por tipo. */
export function getTipoKeywordsForRole(role: string): string[] | null {
  return ROLE_TIPO_KEYWORDS[role] ?? null;
}

export function getDgsConvocadas(datosProduccion: unknown): string[] {
  if (!datosProduccion) return [];
  let dp = datosProduccion;
  if (typeof dp === "string") {
    try {
      dp = JSON.parse(dp);
    } catch {
      return [];
    }
  }
  if (typeof dp === "object" && dp !== null && "dgsConvocadas" in dp) {
    const raw = (dp as { dgsConvocadas: unknown }).dgsConvocadas;
    if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof raw === "string") {
      return raw.includes(";;")
        ? raw.split(";;").map((s) => s.trim()).filter(Boolean)
        : raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function isDgConvocada(
  event: { datosProduccion?: unknown },
  area?: string | null
): boolean {
  if (!area) return false;
  const convocadas = getDgsConvocadas(event.datosProduccion);
  return convocadas.some((c) => c.toLowerCase() === area.toLowerCase());
}

/**
 * ¿El usuario puede ver este evento?
 * - Admin / Validador: todos
 * - Institucionales / Agenda: todos (lectura; las acciones siguen condicionadas a si les corresponde)
 * - Director General / Organización: eventos creados por él, de su área, convocados o CONFIRMADOS de otras DGs
 * - Producción / Cobertura: solo si tipoEvento los incluye
 */
/** Eventos de AREA CENTRAL los ve cualquier usuario. */
export function isAreaCentralEvent(event: { areaSolicitante?: string | null }): boolean {
  return (event.areaSolicitante ?? "").trim().toLowerCase() === "area central";
}

export function canUserSeeEvent(
  user: EventVisibilityUser,
  event: {
    tipoEvento?: string | null;
    areaSolicitante?: string | null;
    createdById?: string | null;
    estado?: string | null;
    datosProduccion?: unknown;
    areaDecisions?: { areaRole?: string | null; estado?: string | null }[] | null;
  }
): boolean {
  if (ROLES_SEE_ALL.has(user.role)) return true;

  // Lo que carga AREA CENTRAL (director Julian Vilche) es visible para todos los roles.
  if (isAreaCentralEvent(event)) return true;

  // Agenda / Institucionales necesitan ver toda la agenda aunque no les hayan pedido soporte.
  if (user.role === "INSTITUCIONALES" || user.role === "AGENDA") return true;

  const keywords = getTipoKeywordsForRole(user.role);
  if (keywords) {
    return tipoEventoMatchesKeywords(event.tipoEvento, keywords);
  }

  if (user.role === "DIRECTOR_GENERAL" || user.role === "ORGANIZACION") {
    if (event.createdById && event.createdById === user.id) return true;
    if (user.area && event.areaSolicitante && user.area.toLowerCase() === event.areaSolicitante.toLowerCase()) {
      return true;
    }
    if (user.area && isDgConvocada(event, user.area)) return true;
    // Confirmados o ya aprobados por Institucionales (aunque falte otra área).
    if (event.estado === "CONFIRMADO" || event.estado === "REALIZADO") return true;
    if (hasInstitucionalesApproved(event)) return true;
    // Sin área: ve los que creó; si no hay createdById legacy, no restringir por área
    if (!user.area) return true;
    return false;
  }

  // Roles desconocidos: sin acceso ajenos
  return false;
}

export function filterEventsForUser<T extends {
  tipoEvento?: string | null;
  areaSolicitante?: string | null;
  createdById?: string | null;
  estado?: string | null;
  datosProduccion?: unknown;
  areaDecisions?: { areaRole?: string | null; estado?: string | null }[] | null;
}>(user: EventVisibilityUser, events: T[]): T[] {
  if (ROLES_SEE_ALL.has(user.role)) return events;
  return events.filter((e) => canUserSeeEvent(user, e));
}
