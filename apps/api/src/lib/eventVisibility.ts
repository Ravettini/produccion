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
  "DIRECTOR_GENERAL",
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

/**
 * ¿El usuario puede ver este evento?
 * - Admin / DG / Validador: todos
 * - Producción / Institucionales (Agenda) / Cobertura: solo si tipoEvento los incluye
 * - Organización: eventos de su área o creados por él
 */
export function canUserSeeEvent(
  user: EventVisibilityUser,
  event: {
    tipoEvento?: string | null;
    areaSolicitante?: string | null;
    createdById?: string | null;
  }
): boolean {
  if (ROLES_SEE_ALL.has(user.role)) return true;

  const keywords = getTipoKeywordsForRole(user.role);
  if (keywords) {
    return tipoEventoMatchesKeywords(event.tipoEvento, keywords);
  }

  if (user.role === "ORGANIZACION") {
    if (event.createdById && event.createdById === user.id) return true;
    if (user.area && event.areaSolicitante === user.area) return true;
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
}>(user: EventVisibilityUser, events: T[]): T[] {
  if (ROLES_SEE_ALL.has(user.role)) return events;
  return events.filter((e) => canUserSeeEvent(user, e));
}
