import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listEvents } from "../api/events";
import type { Event, EventStatus } from "../types";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  EmptyState,
  ErrorState,
  EventListSkeleton,
} from "../components/ui";
import { eventStatusLabels, eventStatusColors } from "../utils/labels";
import { formatDate } from "../utils/formatters";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  ...(Object.entries(eventStatusLabels) as [EventStatus, string][]).map(([v, l]) => ({
    value: v,
    label: l,
  })),
];

export default function EventList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const filtered = useMemo(() => {
    let list = [...events];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.titulo.toLowerCase().includes(q) ||
          e.areaSolicitante.toLowerCase().includes(q) ||
          e.tipoEvento.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((e) => e.estado === statusFilter);
    }
    list.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.fechaTentativa).getTime() - new Date(a.fechaTentativa).getTime();
      }
      return a.titulo.localeCompare(b.titulo);
    });
    return list;
  }, [events, search, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">Eventos</h1>
        <EventListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">Eventos</h1>
        <ErrorState
          message={error instanceof Error ? error.message : "Error al cargar eventos"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Eventos</h1>
        <Link to="/events/new">
          <Button size="sm">Nuevo evento</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          placeholder="Buscar por título, área o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] sm:min-w-[280px]"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[140px] sm:w-40"
          />
          <Select
            options={[
              { value: "date", label: "Ordenar por fecha" },
              { value: "title", label: "Ordenar por título" },
            ]}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "title")}
            className="w-[160px] sm:w-44"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={events.length === 0 ? "No hay eventos" : "No hay resultados"}
          description={
            events.length === 0
              ? "Creá uno desde «Nuevo evento»."
              : "Probá con otros filtros o búsqueda."
          }
          action={
            <Link to="/events/new">
              <Button>Nuevo evento</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e: Event) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              className="block p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-gov-400 hover:shadow-md transition"
            >
              <h2 className="font-semibold text-slate-800 truncate">{e.titulo}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {e.tipoEvento} · {e.areaSolicitante}
              </p>
              <p className="text-sm text-slate-500 mt-1">{formatDate(e.fechaTentativa)}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge className={eventStatusColors[e.estado as EventStatus]}>
                  {eventStatusLabels[e.estado as EventStatus]}
                </Badge>
                {e._count && (
                  <span className="text-slate-500 text-sm">
                    {e._count.proposals} propuestas
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
