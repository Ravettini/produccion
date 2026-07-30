/**
 * Check de aprobación de las áreas involucradas en un evento.
 * Las filas PENDING pueden no existir todavía en la base, así que el listado
 * se arma siempre a partir de las áreas que pide el tipo de evento.
 */
import { getRequestedAreaRoles, type AreaDecisionRole } from "./eventVisibility.js";

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

/** Una entrada por área solicitada, con PENDING cuando todavía no hay decisión. */
export function buildAreaChecklist(
  tipoEvento: unknown,
  decisions: AreaDecisionRow[] = []
): AreaChecklistItem[] {
  const tipo = tipoEvento == null ? null : String(tipoEvento);
  const byArea = new Map(decisions.map((d) => [String(d.areaRole), d]));
  return getRequestedAreaRoles(tipo).map((areaRole) => {
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
