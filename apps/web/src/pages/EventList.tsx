import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { listEvents } from "../api/events";
import type { Event, EventStatus } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Tabs } from "../components/ui/Tabs";
import { eventMatchesTipoFilter } from "../utils/eventHelpers";
import {
  EmptyState,
  ErrorState,
  EventListSkeleton,
  StatCard,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { EventCard } from "../components/domain/EventCard";
import { eventStatusLabels } from "../utils/labels";
import { CheckCircle2, FileStack, Clock, Radar, BellRing } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { canCreateEvent, isOutsideSsccyrs } from "../hooks/usePermissions";
import { getEventPendingForUser } from "../utils/changeAlerts";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  ...(Object.entries(eventStatusLabels) as [EventStatus, string][]).filter(([v]) => v !== "REALIZADO").map(([v, l]) => ({
    value: v,
    label: l,
  })),
];

export default function EventList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "date" | "title">("created");
  const [soloPendientes, setSoloPendientes] = useState(false);

  const specialtyHint = isOutsideSsccyrs(user)
    ? "Ves el calendario y los eventos de tu subsecretaría."
    : user?.role === "ADMIN"
      ? "Ves y gestionás eventos con Producción o Cobertura. Los que son solo Institucionales no aparecen."
      : user?.role === "SUPERADMIN" || user?.role === "VALIDADOR"
      ? null
      : "Ves las DG y proyectos de SSCCYRS, incluida la Ss. de Cultura Ciudadana y Responsabilidad Social.";

  const { data: allEvents = [], isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const events = useMemo(() => allEvents.filter((event) => event.estado !== "REALIZADO"), [allEvents]);

  const areas = useMemo(() => [...new Set(events.map((e) => e.areaSolicitante.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es")), [events]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      enRadar: events.filter((e) => e.estado === "EN_RADAR").length,
      enAnalisis: events.filter((e) => e.estado === "EN_ANALISIS").length,
      confirmados: events.filter((e) => e.estado === "CONFIRMADO").length,
      requierenAccion: events.filter(
        (e) => getEventPendingForUser(user?.role, e).requiereAccion
      ).length,
    };
  }, [events, user?.role]);

  const filtered = useMemo(() => {
    let list = [...events];
    if (tipoFilter) list = list.filter((e) => eventMatchesTipoFilter(e.tipoEvento, tipoFilter));
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
    if (areaFilter) {
      list = list.filter((e) => e.areaSolicitante.trim() === areaFilter);
    }
    if (soloPendientes) {
      list = list.filter((e) => getEventPendingForUser(user?.role, e).requiereAccion);
    }
    list.sort((a, b) => {
      if (sortBy === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date") {
        return new Date(b.fechaTentativa).getTime() - new Date(a.fechaTentativa).getTime();
      }
      return a.titulo.localeCompare(b.titulo);
    });
    return list;
  }, [events, search, statusFilter, areaFilter, tipoFilter, sortBy, soloPendientes, user?.role]);

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
          subtitle="Eventos accesibles que aún no fueron realizados"
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
          label="Requieren tu acción"
          value={stats.requierenAccion}
          icon={BellRing}
          accent="amber"
          subtitle="Falta tu aprobación o hay requerimientos por validar"
        />
      </div>

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: "", label: "Todos" },
            { id: "produccion", label: "Producción" },
            { id: "institucionales", label: "Institucionales" },
            { id: "cobertura", label: "Cobertura" },
            { id: "solo-informar", label: "Solo informar" },
          ]}
          active={tipoFilter}
          onChange={setTipoFilter}
          panelId="event-list-results"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative min-w-0 sm:col-span-2 xl:col-span-3">
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
          className="w-full"
        />
        <Select
          options={[
            { value: "created", label: "Orden de llegada (más recientes)" },
            { value: "date", label: "Ordenar por fecha del evento" },
            { value: "title", label: "Ordenar por título" },
          ]}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "created" | "date" | "title")}
          className="w-full"
        />
        <Select
          aria-label="Filtrar por área"
          options={[{ value: "", label: "Todas las áreas" }, ...areas.map((area) => ({ value: area, label: area }))]}
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="w-full"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2 xl:col-span-3">
          <input
            type="checkbox"
            checked={soloPendientes}
            onChange={(e) => setSoloPendientes(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Solo los que requieren mi acción
        </label>
      </div>

      <div id="event-list-results" role="tabpanel" aria-label="Eventos por requerimiento" tabIndex={0}>
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
            <EventCard key={e.id} event={e} userRole={user?.role} userArea={user?.area} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
