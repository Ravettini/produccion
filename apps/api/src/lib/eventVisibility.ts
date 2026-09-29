/**
 * Visibilidad de eventos por rol.
 * Los roles de área (Producción, Institucionales, Cobertura) solo ven
 * eventos donde se les solicitó apoyo en tipoEvento.
 */

export type EventVisibilityUser = {
  id: string;
  role: string;
  area?: string | null;
  email?: string | null;
  esSsccyrs?: boolean | null;
};

/** Roles que ven todos los eventos del sistema. */
export const ROLES_SEE_ALL = new Set([
  "SUPERADMIN",
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

/** El administrador de producción ve eventos con Producción o Cobertura. */
export function eventInvolvesProduccionOCobertura(tipoEvento: string | null | undefined): boolean {
  return tipoEventoMatchesKeywords(tipoEvento, [
    "producción",
    "produccion",
    "cobertura",
    "comunicación",
    "comunicacion",
  ]);
}

export function isStaffAdmin(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
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

export function isOutsideSsccyrsUser(user: EventVisibilityUser): boolean {
  if (user.role === "VICEJEFATURA") return true;
  return user.esSsccyrs === false;
}

function foldArea(area?: string | null): string {
  return (area ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Cada área pertenece a una sola subsecretaría. */
const SUBSECRETARIAS: Record<string, string[]> = {
  "cultura-ciudadana": [
    "ss. de cultura ciudadana y responsabilidad social",
    "cultura ciudadana y responsabilidad social",
    "dg responsabilidad social",
    "responsabilidad social",
    "dg cultura del servicio publico",
    "cultura del servicio publico",
    "dg transformacion cultural",
    "transformacion cultural",
    "dg politicas de juventud",
    "politicas de juventud",
    "dg de la mujer",
    "direccion de la mujer",
    "bienestar ciudadano",
    "comunicacion interna",
    "cultura organizacional",
    "relaciones gubernamentales",
    "relaciones con la comunidad",
    "cooperacion territorial",
    "promotores ba",
    "autonomia economica",
    "igualdad de oportunidades",
    "area central",
  ],
  "relaciones-institucionales": [
    "ss. de relaciones institucionales y comunicacion",
    "dg de relaciones institucionales y entidades",
    "dg comunicacion",
  ],
  ambiente: [
    "ss. de ambiente",
    "dg de politica y estrategia ambiental",
    "dg areas de conservacion y restauracion ambiental",
    "dg desarrollo sostenible y economia circular",
    "dg gestion animal",
  ],
  apra: ["agencia de proteccion ambiental"],
  ecoparque: ["upe ecoparque interactivo de la caba"],
  copidis: [
    "comision para la plena participacion e inclusion de las personas con discapacidad",
    "dg investigacion de politicas para personas con discapacidad",
    "dg accesibilidad universal",
    "dg vida independiente e inclusion economica",
    "dg inclusion digital",
    "dg formacion laboral para personas con discapacidad",
  ],
  vicejefatura: ["dg tecnica, administrativa y legal"],
};

const AREA_A_SUBSECRETARIA = new Map<string, string>();
for (const [sub, areas] of Object.entries(SUBSECRETARIAS)) {
  for (const area of areas) AREA_A_SUBSECRETARIA.set(area, sub);
}

export function subsecretariaDe(area?: string | null): string | null {
  return AREA_A_SUBSECRETARIA.get(foldArea(area)) ?? null;
}

const AREAS_SSCCRS = new Set(SUBSECRETARIAS["cultura-ciudadana"]);

/** DGs y proyectos de SSCCYRS. */
export function isSubsecretariaCulturaCiudadana(area?: string | null): boolean {
  return AREAS_SSCCRS.has(foldArea(area));
}

function eventMatchesUserSubsecretaria(user: EventVisibilityUser, eventArea?: string | null): boolean {
  const propia = subsecretariaDe(user.area);
  const delEvento = subsecretariaDe(eventArea);
  if (!propia || !delEvento) return false;
  return propia === delEvento;
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
  if (user.role === "ADMIN") {
    return eventInvolvesProduccionOCobertura(event.tipoEvento);
  }

  if (ROLES_SEE_ALL.has(user.role)) return true;

  // Persona de una DG o subsecretaría: solo los eventos de esa subsecretaría.
  if (subsecretariaDe(user.area)) {
    return eventMatchesUserSubsecretaria(user, event.areaSolicitante);
  }

  if (isOutsideSsccyrsUser(user)) {
    return Boolean(event.createdById && event.createdById === user.id);
  }

  return isSubsecretariaCulturaCiudadana(event.areaSolicitante);
}

export function filterEventsForUser<T extends {
  tipoEvento?: string | null;
  areaSolicitante?: string | null;
  createdById?: string | null;
  estado?: string | null;
  datosProduccion?: unknown;
  areaDecisions?: { areaRole?: string | null; estado?: string | null }[] | null;
}>(user: EventVisibilityUser, events: T[]): T[] {
  if (user.role === "ADMIN") {
    return events.filter((e) => canUserSeeEvent(user, e));
  }
  if (ROLES_SEE_ALL.has(user.role)) return events;
  return events.filter((e) => canUserSeeEvent(user, e));
}
