import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import type { Event, EventStatus } from "../../types";
import { StatusBadge } from "../ui/StatusBadge";
import { formatDate } from "../../utils/formatters";
import { getEventHorario } from "../../utils/eventHelpers";
import { cn } from "../../utils/cn";

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const horario = getEventHorario(event);

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        "group block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm",
        "hover:border-brand-300 hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 flex-1">
          {event.titulo}
        </h2>
        <StatusBadge kind="event" value={event.estado as EventStatus} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fecha</dt>
          <dd className="text-slate-700 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            {formatDate(event.fechaTentativa)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Horario</dt>
          <dd className="text-slate-700 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            {horario}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">DG solicitante</dt>
          <dd className="text-slate-700 mt-0.5 truncate" title={event.areaSolicitante}>
            {event.areaSolicitante}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
