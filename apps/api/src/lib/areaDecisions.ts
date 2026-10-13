/**
 * Check de aprobación de las áreas involucradas en un evento.
 * Las filas PENDING pueden no existir todavía en la base, así que el listado
 * se arma siempre a partir de las áreas que pide el tipo de evento.
 */
import { getRequestedAreaRoles, normalizeAreaRole, type AreaDecisionRole } from "./eventVisibility.js";

export const AREA_LABELS: Record<AreaDecisionRole, string> = {
  PRODUCCION: "Producción",
  INSTITUCIONALES: "Institucionales",
  COBERTURA: "Cobertura",
};

export interface AreaDecisionRow {
  areaRole: string;
  estado: string;
  reason?: string | null;
  updatedAt?: Date | string | null;
  user?: { id: string; name: string; role?: string | null } | null;
}

export interface AreaChecklistItem {
  areaRole: AreaDecisionRole;
  label: string;
  estado: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
}

/** AGENDA es el nombre histórico de Institucionales. Las decisiones explícitas
 * prevalecen sobre filas PENDING creadas al consultar el panel. */
export function normalizeAreaDecisions<T extends AreaDecisionRow>(decisions: T[]): T[] {
  const byArea = new Map<AreaDecisionRole, T>();
  const timestamp = (row: T) => {
    const value = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
    return Number.isFinite(value) ? value : 0;
  };
  const explicit = (row: T) => row.estado === "APPROVED" || row.estado === "REJECTED";
  for (const row of decisions) {
    const areaRole = normalizeAreaRole(row.areaRole);
    if (!areaRole) continue;
    const current = byArea.get(areaRole);
    if (!current ||
      (explicit(row) && !explicit(current)) ||
      (explicit(row) === explicit(current) &&
        (timestamp(row) > timestamp(current) ||
          (timestamp(row) === timestamp(current) && row.areaRole === areaRole)))) {
      byArea.set(areaRole, { ...row, areaRole });
    }
  }
  return [...byArea.values()];
}

export function allRequestedAreasApproved(event: {
  tipoEvento?: string | null;
  areaSolicitante?: string | null;
}, decisions: AreaDecisionRow[]): boolean {
  const checklist = buildAreaChecklist(event.tipoEvento, decisions, event.areaSolicitante);
  return checklist.length > 0 && checklist.every((item) => item.estado === "APPROVED");
}

/** Mismo estado efectivo para listado y detalle, sin reabrir eventos terminados. */
export function effectiveEventStatus(event: {
  estado: string;
  tipoEvento?: string | null;
  areaSolicitante?: string | null;
}, decisions: AreaDecisionRow[]): string {
  if (["CONFIRMADO", "CANCELADO", "REALIZADO"].includes(event.estado)) return event.estado;
  return allRequestedAreasApproved(event, decisions) ? "CONFIRMADO" : event.estado;
}

export function isAutoConfirmedEvent(event: {
  tipoEvento?: string | null;
  areaSolicitante?: string | null;
}): boolean {
  if (event.areaSolicitante && /responsabilidad\s+social/i.test(event.areaSolicitante)) {
    return true;
  }
  const tipo = String(event.tipoEvento ?? "");
  if (/solo\s+informar/i.test(tipo)) {
    return true;
  }
  return false;
}

/** Una entrada por área solicitada, con PENDING cuando todavía no hay decisión. */
export function buildAreaChecklist(
  tipoEvento: unknown,
  decisions: AreaDecisionRow[] = [],
  areaSolicitante?: unknown
): AreaChecklistItem[] {
  const tipo = tipoEvento == null ? null : String(tipoEvento);
  const area = areaSolicitante == null ? null : String(areaSolicitante);
  if (isAutoConfirmedEvent({ tipoEvento: tipo, areaSolicitante: area })) {
    return [];
  }
  const byArea = new Map(normalizeAreaDecisions(decisions).map((d) => [d.areaRole, d]));
  return getRequestedAreaRoles(tipo, area).map((areaRole) => {
    const found = byArea.get(areaRole);
    const estado =
      found?.estado === "APPROVED" || found?.estado === "REJECTED" ? found.estado : "PENDING";
    return {
      areaRole,
      label: AREA_LABELS[areaRole],
      estado,
      reason: found?.reason ?? null,
      decidedBy: estado === "PENDING" ? null : (found?.user?.name ?? null),
      decidedAt:
        estado === "PENDING" || !found?.updatedAt
          ? null
          : new Date(found.updatedAt).toISOString(),
    };
  });
}
