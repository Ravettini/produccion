import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import type { Event, EventStatus, Role } from "../../types";
import { StatusBadge } from "../ui/StatusBadge";
import { formatEventDate } from "../../utils/formatters";
import { getEventHorario } from "../../utils/eventHelpers";
import {
  areaRoleForUser,
  getEventPendingForUser,
  hasEventUnseenChangesForUser,
} from "../../utils/changeAlerts";
import { AreaChecklistChips } from "./AreaChecklistChips";
import { cn } from "../../utils/cn";

interface EventCardProps {
  event: Event;
  userRole?: Role | string | null;
  className?: string;
}

export function EventCard({ event, userRole, className }: EventCardProps) {
  const horario = getEventHorario(event);
  const changed = hasEventUnseenChangesForUser(userRole, event, event.proposals ?? []);
  const pending = getEventPendingForUser(userRole, event);
  const miArea = areaRoleForUser(userRole);

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        "group block bg-white rounded-2xl border p-4 sm:p-5 shadow-sm",
        "hover:border-brand-300 hover:shadow-md transition-all duration-200",
        pending.requiereAccion
          ? "border-brand-400 ring-2 ring-brand-100"
          : changed
            ? "border-amber-400 ring-2 ring-amber-100"
            : "border-slate-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 flex-1">
          {event.titulo}
        </h2>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge kind="event" value={event.estado as EventStatus} />
          {pending.faltaMiAprobacion && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-brand-100 text-brand-900">
              Falta tu aprobación
            </span>
          )}
          {pending.porValidar > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-brand-100 text-brand-900">
              {pending.porValidar} por validar
            </span>
          )}
          {changed && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-900">
              Cambios
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fecha</dt>
          <dd className="text-slate-700 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            {formatEventDate(event.fechaTentativa)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Horario</dt>
          <dd className="text-slate-700 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            {horario}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Área solicitante
          </dt>
          <dd className="text-slate-700 mt-0.5 truncate" title={event.areaSolicitante}>
            {event.areaSolicitante}
          </dd>
        </div>
      </dl>

      {event.areaChecklist && event.areaChecklist.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
            Involucrados
          </p>
          <AreaChecklistChips
            items={event.areaChecklist}
            highlightAreaRole={miArea}
            size="sm"
          />
        </div>
      )}
    </Link>
  );
}
