import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Pencil,
  PlusCircle,
  Send,
  XCircle,
} from "lucide-react";
import { getEventAudits, type EventActivityItem } from "../../api/eventDecisions";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { formatDateShort } from "../../utils/formatters";
import { proposalStatusLabels } from "../../utils/labels";

interface EventChangesPanelProps {
  eventId: string;
  /** Si true, resalta el panel (hay cambios recientes). */
  highlight?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  funcionario: "Funcionario(s)",
  lugar: "Locación confirmada",
  programa: "Programa",
  productor: "Responsable de Producción",
  usuarioSolicitante: "Referente del área solicitante",
  titulo: "Título",
  descripcion: "Descripción",
};

function describeItem(item: EventActivityItem): { title: string; detail?: string } {
  const who = item.user?.name ?? "Usuario";

  if (item.source === "event") {
    if (item.action === "EDIT") {
      const field = FIELD_LABELS[item.field ?? ""] ?? item.field ?? "campo";
      return {
        title: `${who} editó ${field}`,
        detail:
          item.fromValue || item.toValue
            ? `${item.fromValue ?? "—"} → ${item.toValue ?? "—"}`
            : item.reason ?? undefined,
      };
    }
    if (item.action === "AREA_APPROVE") {
      return { title: `${who} aprobó ${item.field ?? "área"}`, detail: item.reason ?? undefined };
    }
    if (item.action === "AREA_REJECT") {
      return { title: `${who} rechazó ${item.field ?? "área"}`, detail: item.reason ?? undefined };
    }
    return { title: `${who}: ${item.action}`, detail: item.reason ?? undefined };
  }

  const req = item.proposalTitulo ? `«${item.proposalTitulo}»` : "requerimiento";
  const statusLine =
    item.fromStatus || item.toStatus
      ? [
          item.fromStatus
            ? proposalStatusLabels[item.fromStatus as keyof typeof proposalStatusLabels] ??
              item.fromStatus
            : null,
          item.toStatus
            ? proposalStatusLabels[item.toStatus as keyof typeof proposalStatusLabels] ??
              item.toStatus
            : null,
        ]
          .filter(Boolean)
          .join(" → ")
      : undefined;

  const actionLabel: Record<string, string> = {
    CREATE: `creó el requerimiento ${req}`,
    SUBMIT: `envió a validación ${req}`,
    APPROVE: `aprobó ${req}`,
    REJECT: `rechazó ${req}`,
    CANCEL: `canceló ${req}`,
    EDIT: `editó ${req}`,
  };

  return {
    title: `${who} ${actionLabel[item.action] ?? `${item.action} ${req}`}`,
    detail: item.reason || statusLine,
  };
}

function iconFor(item: EventActivityItem) {
  if (item.source === "event") {
    if (item.action === "AREA_APPROVE") return { Icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" };
    if (item.action === "AREA_REJECT") return { Icon: XCircle, color: "text-red-600 bg-red-50" };
    return { Icon: Pencil, color: "text-indigo-600 bg-indigo-50" };
  }
  const map: Record<string, { Icon: typeof CheckCircle2; color: string }> = {
    CREATE: { Icon: PlusCircle, color: "text-brand-600 bg-brand-50" },
    SUBMIT: { Icon: Send, color: "text-amber-600 bg-amber-50" },
    APPROVE: { Icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    REJECT: { Icon: XCircle, color: "text-red-600 bg-red-50" },
    CANCEL: { Icon: Ban, color: "text-slate-600 bg-slate-100" },
    EDIT: { Icon: ArrowRight, color: "text-indigo-600 bg-indigo-50" },
  };
  return map[item.action] ?? { Icon: ArrowRight, color: "text-slate-600 bg-slate-100" };
}

export function EventChangesPanel({ eventId, highlight }: EventChangesPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["event-audits", eventId],
    queryFn: () => getEventAudits(eventId),
  });

  const items = data?.items ?? [];

  return (
    <div id="cambios-del-evento">
    <Card
      className={
        highlight
          ? "border-amber-300 ring-1 ring-amber-100"
          : undefined
      }
    >
      <CardHeader subtitle="Evento y requerimientos · más recientes primero">
        Cambios
      </CardHeader>
      <CardBody>
        {isLoading && (
          <p className="text-sm text-slate-500">Cargando cambios…</p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            Todavía no hay cambios registrados en este evento.
          </p>
        )}
        {!isLoading && items.length > 0 && (
          <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.slice(0, 40).map((item) => {
              const { title, detail } = describeItem(item);
              const { Icon, color } = iconFor(item);
              return (
                <li
                  key={`${item.source}-${item.id}`}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${color}`}
                  >
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium text-slate-900">{title}</p>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        {item.source === "event" ? "Evento" : "Requerimiento"}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {formatDateShort(item.createdAt)}
                      </span>
                    </div>
                    {detail && (
                      <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{detail}</p>
                    )}
                    {item.source === "proposal" && item.proposalId && (
                      <Link
                        to={`/proposals/${item.proposalId}`}
                        className="text-xs text-brand-600 hover:underline mt-1 inline-block"
                      >
                        Ver requerimiento
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
    </div>
  );
}
