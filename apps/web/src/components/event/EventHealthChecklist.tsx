import type { Proposal, ProposalStatus } from "../../types";
import { categoryLabels } from "../../utils/labels";

const CATEGORY_KEYS = ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"] as const;

interface EventHealthChecklistProps {
  eventId: string;
  eventTitle: string;
  proposals: Proposal[];
  loading?: boolean;
  onGoToTab: (tab: "estado" | "propuestas", filterEstado?: ProposalStatus) => void;
}

function countByStatus(proposals: Proposal[]) {
  const draft = proposals.filter((p) => p.estado === "DRAFT").length;
  const submitted = proposals.filter((p) => p.estado === "SUBMITTED").length;
  const approved = proposals.filter((p) => p.estado === "APPROVED").length;
  const rejected = proposals.filter((p) => p.estado === "REJECTED").length;
  return { draft, submitted, approved, rejected };
}

function categoriesWithApproved(proposals: Proposal[]) {
  const byCat: Record<string, boolean> = {};
  CATEGORY_KEYS.forEach((c) => (byCat[c] = false));
  proposals.filter((p) => p.estado === "APPROVED").forEach((p) => (byCat[p.categoria] = true));
  return byCat;
}

export function EventHealthChecklist({
  eventId,
  eventTitle,
  proposals,
  loading,
  onGoToTab,
}: EventHealthChecklistProps) {
  const { draft, submitted, approved, rejected } = countByStatus(proposals);
  const categoriesOk = categoriesWithApproved(proposals);
  const totalSteps = 5;
  const stepsDone =
    (approved > 0 ? 1 : 0) +
    (draft === 0 ? 1 : 0) +
    (submitted === 0 ? 1 : 0) +
    (Object.values(categoriesOk).filter(Boolean).length >= 2 ? 1 : 0) +
    (rejected === 0 ? 1 : 0);
  const progressPercent = totalSteps > 0 ? Math.round((stepsDone / totalSteps) * 100) : 0;

  if (loading) {
    return (
      <div
        className="rounded-card border border-slate-200 bg-slate-50/80 p-4 sm:p-5 shadow-card animate-pulse"
        aria-label="Cargando estado del evento"
      >
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="h-2 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-slate-200 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasPending = draft > 0 || submitted > 0;
  const hasRejected = rejected > 0;

  return (
    <section
      className="rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-card"
      aria-labelledby="event-health-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 id="event-health-heading" className="text-base font-semibold text-slate-800">
          Salud del evento
        </h2>
        <span className="text-sm text-slate-500">
          {stepsDone} de {totalSteps} pasos
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gov-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          {approved > 0 ? (
            <span className="text-success flex-shrink-0" aria-hidden>✔</span>
          ) : (
            <span className="text-slate-300 flex-shrink-0" aria-hidden>○</span>
          )}
          <span className="text-slate-700">
            Propuestas aprobadas: <strong>{approved}</strong>
          </span>
        </li>
        {draft > 0 && (
          <li className="flex items-center gap-2">
            <span className="text-warning flex-shrink-0" aria-hidden>⚠</span>
            <span className="text-slate-700">
              Pendientes de enviar: <strong>{draft}</strong>
            </span>
          </li>
        )}
        {submitted > 0 && (
          <li className="flex items-center gap-2">
            <span className="text-info flex-shrink-0" aria-hidden>⚠</span>
            <span className="text-slate-700">
              Enviadas, pendientes de decisión (ADMIN): <strong>{submitted}</strong>
            </span>
          </li>
        )}
        {rejected > 0 && (
          <li className="flex items-center gap-2">
            <span className="text-error flex-shrink-0" aria-hidden>✖</span>
            <span className="text-slate-700">
              Rechazadas (con motivo): <strong>{rejected}</strong>
            </span>
          </li>
        )}
        <li className="flex items-start gap-2">
          {Object.values(categoriesOk).some(Boolean) ? (
            <span className="text-success flex-shrink-0 mt-0.5" aria-hidden>✔</span>
          ) : (
            <span className="text-slate-300 flex-shrink-0 mt-0.5" aria-hidden>○</span>
          )}
          <span className="text-slate-700">
            Categorías con al menos una aprobada:{" "}
            {CATEGORY_KEYS.filter((c) => categoriesOk[c]).map((c) => categoryLabels[c]).join(", ") || "ninguna"}
          </span>
        </li>
      </ul>

      {hasPending && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onGoToTab(submitted > 0 ? "estado" : "propuestas", submitted > 0 ? "SUBMITTED" : undefined)}
            className="text-sm font-medium text-gov-600 hover:text-gov-800 focus:outline-none focus:ring-2 focus:ring-gov-500 focus:ring-offset-2 rounded-button px-2 py-1"
          >
            Ver propuestas pendientes →
          </button>
        </div>
      )}
    </section>
  );
}
