import { Link } from "react-router-dom";
import type { Event, EventStatus } from "../../types";
import { eventStatusLabels, eventStatusColors } from "../../utils/labels";
import { getEventHorario } from "../../utils/eventHelpers";

const DIAS_SEMANA_LARGO = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface CalendarAgendaListProps {
  year: number;
  month: number;
  eventsByDate: Record<string, Event[]>;
  today: Date;
}

export function CalendarAgendaList({
  year,
  month,
  eventsByDate,
  today,
}: CalendarAgendaListProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysWithEvents: { day: number; key: string; events: Event[] }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const events = eventsByDate[key] ?? [];
    if (events.length > 0) {
      daysWithEvents.push({ day, key, events });
    }
  }

  if (daysWithEvents.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No hay eventos en {MESES[month]} {year} con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {daysWithEvents.map(({ day, key, events }) => {
        const date = new Date(year, month, day);
        const isToday =
          today.getFullYear() === year &&
          today.getMonth() === month &&
          today.getDate() === day;

        return (
          <section key={key}>
            <div
              className={`sticky top-0 z-10 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 ${
                isToday ? "bg-brand-50" : "bg-slate-50/90 backdrop-blur-sm"
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {DIAS_SEMANA_LARGO[date.getDay()]}
                </p>
                <p className={`text-sm font-semibold ${isToday ? "text-brand-700" : "text-slate-800"}`}>
                  {day} de {MESES[month]}
                </p>
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {events.length} evento{events.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="p-3 space-y-2">
              {events.map((ev) => (
                <li key={ev.id}>
                  <Link
                    to={`/events/${ev.id}`}
                    className="block p-3 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-medium text-slate-900 text-sm break-words flex-1 min-w-0">
                        {ev.titulo}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${eventStatusColors[ev.estado as EventStatus]}`}
                      >
                        {eventStatusLabels[ev.estado as EventStatus]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{ev.areaSolicitante}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{getEventHorario(ev)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
