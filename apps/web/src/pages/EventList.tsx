import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { listEvents } from "../api/events";
import type { Event, EventStatus } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  EmptyState,
  ErrorState,
  EventListSkeleton,
  StatCard,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { EventCard } from "../components/domain/EventCard";
import { eventStatusLabels } from "../utils/labels";
import { CheckCircle2, FileStack, Clock, Radar } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { canCreateEvent } from "../hooks/usePermissions";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  ...(Object.entries(eventStatusLabels) as [EventStatus, string][]).map(([v, l]) => ({
    value: v,
    label: l,
  })),
];

export default function EventList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");

  const specialtyHint =
    user?.role === "PRODUCCION"
      ? "Mostrás solo eventos que solicitaron requerimiento de Producción."
      : user?.role === "INSTITUCIONALES" || user?.role === "AGENDA"
        ? "Mostrás solo eventos que solicitaron requerimiento Institucional."
        : user?.role === "COBERTURA"
          ? "Mostrás solo eventos que solicitaron Cobertura."
          : user?.role === "ORGANIZACION" && user.area
            ? `Mostrás eventos de tu área (${user.area}) y los que creaste.`
            : null;

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const stats = useMemo(() => {
    return {
      total: events.length,
      enRadar: events.filter((e) => e.estado === "EN_RADAR").length,
      enAnalisis: events.filter((e) => e.estado === "EN_ANALISIS").length,
      confirmados: events.filter((e) => e.estado === "CONFIRMADO").length,
      pendientes: events.filter((e) => e.estado === "PENDIENTE").length,
    };
  }, [events]);

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
      <div className="page-container">
        <PageHeader title="Eventos" subtitle="Gestioná eventos, requerimientos y briefs institucionales" />
        <EventListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageHeader title="Eventos" />
        <ErrorState
          message={error instanceof Error ? error.message : "Error al cargar eventos"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Eventos"
        subtitle={
          specialtyHint ??
          "Gestioná eventos, requerimientos y briefs institucionales"
        }
        actions={
          canCreateEvent(user) ? (
            <Link to="/events/new">
              <Button>
                <Plus className="w-4 h-4" aria-hidden />
                Nuevo evento
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-2">
        <p className="text-sm text-slate-500">
          Resumen del listado según el estado actual de cada evento.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-8">
        <StatCard
          label="Total de eventos"
          value={stats.total}
          icon={FileStack}
          accent="blue"
          subtitle="Todos los eventos cargados en el sistema"
        />
        <StatCard
          label="En radar"
          value={stats.enRadar}
          icon={Radar}
          accent="blue"
          subtitle="Largo plazo; se siguen sin fecha inmediata"
        />
        <StatCard
          label="En análisis"
          value={stats.enAnalisis}
          icon={Clock}
          accent="amber"
          subtitle="En revisión / armado de requerimientos"
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmados}
          icon={CheckCircle2}
          accent="green"
          subtitle="Eventos aprobados y listos para realizarse"
        />
        <StatCard
          label="Pendientes"
          value={stats.pendientes}
          icon={Clock}
          accent="slate"
          subtitle="Solicitudes nuevas aguardando gestión"
        />
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
          <Input
            placeholder="Buscar por título, área o tipo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={[
            { value: "date", label: "Ordenar por fecha" },
            { value: "title", label: "Ordenar por título" },
          ]}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "title")}
          className="w-full sm:w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={events.length === 0 ? "No hay eventos todavía" : "Sin resultados"}
          description={
            events.length === 0
              ? "Creá el primer evento para comenzar a gestionar requerimientos."
              : "Probá con otros filtros o términos de búsqueda."
          }
          action={
            <Link to="/events/new">
              <Button>
                <Plus className="w-4 h-4" aria-hidden />
                Nuevo evento
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e: Event) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
