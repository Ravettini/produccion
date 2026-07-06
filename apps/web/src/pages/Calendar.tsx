import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { listEvents } from "../api/events";
import type { Event, EventStatus } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PageHeader } from "../components/layout/PageHeader";
import { eventStatusLabels, eventStatusColors } from "../utils/labels";
import { getEventHorario, eventMatchesTipoFilter } from "../utils/eventHelpers";

const FILTROS_TIPO = [
  { id: "produccion", label: "Producción" },
  { id: "institucionales", label: "Institucionales" },
  { id: "cobertura", label: "Cobertura" },
] as const;

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventDateKey(fechaTentativa: string): string {
  const s = String(fechaTentativa).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return dateKey(new Date(fechaTentativa));
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();
  const total = startPad + daysInMonth;
  const endPad = (7 - (total % 7)) % 7;
  const padStart = Array<null>(startPad).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padEnd = Array<null>(endPad).fill(null);
  return [...padStart, ...days, ...padEnd];
}

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [current, setCurrent] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [filterTipos, setFilterTipos] = useState<string[]>([]);
  const [filterEstado, setFilterEstado] = useState<EventStatus | "">("");
  const [filterArea, setFilterArea] = useState("");
  const [filterBusqueda, setFilterBusqueda] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const areasUnicas = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.areaSolicitante?.trim()) set.add(e.areaSolicitante.trim());
    });
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterEstado && e.estado !== filterEstado) return false;
      if (filterTipos.length > 0 && !filterTipos.some((f) => eventMatchesTipoFilter(e.tipoEvento, f))) {
        return false;
      }
      if (filterArea && e.areaSolicitante?.trim() !== filterArea) return false;
      if (filterBusqueda) {
        const q = filterBusqueda.toLowerCase();
        if (
          !e.titulo.toLowerCase().includes(q) &&
          !e.areaSolicitante?.toLowerCase().includes(q) &&
          !e.tipoEvento.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [events, filterEstado, filterTipos, filterArea, filterBusqueda]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const e of filteredEvents) {
      const key = eventDateKey(e.fechaTentativa);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [filteredEvents]);

  const calendarDays = useMemo(
    () => getCalendarDays(current.year, current.month),
    [current.year, current.month]
  );

  const goPrev = () => {
    setCurrent((c) =>
      c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
    );
  };
  const goNext = () => {
    setCurrent((c) =>
      c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
    );
  };
  const goToday = () => {
    setCurrent({ year: today.getFullYear(), month: today.getMonth() });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Calendario"
        subtitle="Vista mensual de eventos institucionales"
        actions={
          <Link to="/events/new">
            <Button size="sm">
              <Plus className="w-4 h-4" aria-hidden />
              Nuevo evento
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Input
          placeholder="Buscar por título, área o tipo..."
          value={filterBusqueda}
          onChange={(e) => setFilterBusqueda(e.target.value)}
          className="flex-1 min-w-[200px] max-w-xs"
        />
        <Select
          options={[
            { value: "", label: "Todos los estados" },
            ...(Object.entries(eventStatusLabels) as [EventStatus, string][]).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={filterEstado}
          onChange={(e) => setFilterEstado((e.target.value || "") as EventStatus)}
          className="w-[160px]"
        />
        <Select
          options={[
            { value: "", label: "Todas las DG" },
            ...areasUnicas.map((a) => ({ value: a, label: a })),
          ]}
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="w-full sm:w-52"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-500 mr-1">Tipo:</span>
          {FILTROS_TIPO.map(({ id, label }) => {
            const active = filterTipos.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setFilterTipos((prev) =>
                    active ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 text-slate-700 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 min-w-[180px] text-center px-2">
              {MESES[current.month]} {current.year}
            </h2>
            <button
              type="button"
              onClick={goNext}
              className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 text-slate-700 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Hoy
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-600">Cargando eventos…</div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-slate-200">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="p-2 text-center text-xs font-semibold text-slate-600 bg-slate-100 border-r border-slate-200 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr min-h-[350px] sm:min-h-[400px]">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[70px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-slate-100 bg-slate-50/30 last:border-r-0"
                    />
                  );
                }
                const key = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDate[key] ?? [];
                const isToday =
                  today.getFullYear() === current.year &&
                  today.getMonth() === current.month &&
                  today.getDate() === day;

                return (
                  <div
                    key={key}
                    className={`min-h-[70px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-slate-100 p-1.5 flex flex-col last:border-r-0 ${
                      isToday ? "bg-brand-50/80 ring-1 ring-inset ring-brand-200" : "bg-white"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold shrink-0 ${
                        isToday
                          ? "text-white bg-brand-600 rounded-lg w-7 h-7 flex items-center justify-center shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="flex-1 overflow-y-auto mt-1 space-y-1">
                      {dayEvents.map((ev) => (
                        <Link
                          key={ev.id}
                          to={`/events/${ev.id}`}
                          className="block text-[10px] sm:text-xs p-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 transition-colors truncate"
                          title={`${ev.titulo} — ${ev.areaSolicitante} — ${getEventHorario(ev)}`}
                        >
                          <span className="font-medium text-slate-800 block truncate">
                            {ev.titulo}
                          </span>
                          <span className="text-slate-500 truncate block">
                            {ev.areaSolicitante}
                          </span>
                          <span className="text-slate-500 truncate block">
                            {getEventHorario(ev)}
                          </span>
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${eventStatusColors[ev.estado as EventStatus]}`}
                          >
                            {eventStatusLabels[ev.estado as EventStatus]}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
        <p className="font-medium text-slate-800 mb-2">Leyenda</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(eventStatusLabels) as EventStatus[]).map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${eventStatusColors[s]}`}
            >
              {eventStatusLabels[s]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
