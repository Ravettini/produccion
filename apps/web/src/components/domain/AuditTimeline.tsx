import {
  CheckCircle2,
  XCircle,
  Send,
  Ban,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import type { ProposalAudit } from "../../types";
import { formatDateShort } from "../../utils/formatters";
import { proposalStatusLabels } from "../../utils/labels";

interface AuditTimelineProps {
  audits: ProposalAudit[];
}

const actionConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  CREATE: { icon: PlusCircle, color: "text-brand-600 bg-brand-50", label: "Creada" },
  SUBMIT: { icon: Send, color: "text-amber-600 bg-amber-50", label: "Enviada" },
  APPROVE: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", label: "Aprobada" },
  REJECT: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rechazada" },
  CANCEL: { icon: Ban, color: "text-slate-600 bg-slate-100", label: "Cancelada" },
};

export function AuditTimeline({ audits }: AuditTimelineProps) {
  if (audits.length === 0) {
    return <p className="text-sm text-slate-500 italic">Sin registros de auditoría.</p>;
  }

  return (
    <ol className="relative space-y-0">
      {audits.map((audit, i) => {
        const cfg = actionConfig[audit.action] ?? {
          icon: ArrowRight,
          color: "text-slate-600 bg-slate-100",
          label: audit.action,
        };
        const Icon = cfg.icon;
        const isLast = i === audits.length - 1;

        return (
          <li key={audit.id} className="relative pl-10 pb-8 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200"
                aria-hidden
              />
            )}
            <span
              className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}
            >
              <Icon className="w-4 h-4" aria-hidden />
            </span>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">{cfg.label}</span>
                {audit.user && (
                  <span className="text-slate-500">· {audit.user.name}</span>
                )}
                <span className="text-slate-400 text-xs ml-auto">
                  {formatDateShort(audit.createdAt)}
                </span>
              </div>
              {(audit.fromStatus || audit.toStatus) && (
                <p className="text-sm text-slate-600 mt-1">
                  {audit.fromStatus && proposalStatusLabels[audit.fromStatus as keyof typeof proposalStatusLabels]}
                  {audit.fromStatus && audit.toStatus && " → "}
                  {audit.toStatus && proposalStatusLabels[audit.toStatus as keyof typeof proposalStatusLabels]}
                </p>
              )}
              {audit.reason && (
                <p className="text-sm text-red-700 mt-2 bg-red-50 rounded-lg px-3 py-2">
                  Motivo: {audit.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
