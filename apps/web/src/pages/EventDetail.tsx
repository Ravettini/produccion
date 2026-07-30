import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, FileDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvent, updateEvent, deleteEvent, syncAcreditappEvent } from "../api/events";
import { listProposals, createProposal } from "../api/proposals";
import { generarBriefIA, exportarBriefAcDocx } from "../api/ai";
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  openAttachment,
  type EventAttachment,
} from "../api/attachments";
import type { EventStatus, Proposal, ProposalCategory, ProposalStatus } from "../types";
import { useAuth } from "../hooks/useAuth";
import { canCreateProposal, canConfirmEvent, canDeleteEvent, canEditEvent } from "../hooks/usePermissions";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Modal,
  TextArea,
  Select,
  Input,
  DetailSkeleton,
  EmptyState,
  StatusBadge,
  StatCard,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { ProposalCard } from "../components/domain/ProposalCard";
import {
  eventStatusLabels,
  proposalStatusLabels,
  categoryLabels,
} from "../utils/labels";
import { categoryExtraFields } from "../config/proposalCategoryFields";
import { formatEventDate } from "../utils/formatters";
import { EventHealthChecklist } from "../components/event/EventHealthChecklist";
import { EventOverview } from "../components/event/EventOverview";
import { AreaDecisionsPanel } from "../components/domain/AreaDecisionsPanel";
import { AreaChecklistChips } from "../components/domain/AreaChecklistChips";
import { EventChangesPanel } from "../components/domain/EventChangesPanel";
import {
  areaRoleForUser,
  getEventPendingForUser,
  hasEventUnseenChangesForUser,
  hasUnseenChanges,
  markSeen,
  proposalRelevantToRole,
} from "../utils/changeAlerts";

type EventDetailTab =
  | "estado"
  | "requerimientos"
  | "aprobaciones"
  | "documentos"
  | "cambios";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState<EventDetailTab>("estado");
  const [filterEstado, setFilterEstado] = useState<ProposalStatus | "">("");
  const [filterCategoria, setFilterCategoria] = useState<ProposalCategory | "">("");
  const [editingResumen, setEditingResumen] = useState(false);
  const [resumenDraft, setResumenDraft] = useState("");
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [briefGenerado, setBriefGenerado] = useState("");
  const [confirmEstado, setConfirmEstado] = useState<EventStatus | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [realizacionAsistentes, setRealizacionAsistentes] = useState<string>("");
  const [realizacionImpacto, setRealizacionImpacto] = useState("");
  const [realizacionLinkImpacto, setRealizacionLinkImpacto] = useState("");
  const [realizacionPdfFile, setRealizacionPdfFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportandoAc, setExportandoAc] = useState(false);
  const [showChangeAlert, setShowChangeAlert] = useState(false);
  const [acreditappWarning, setAcreditappWarning] = useState<string | undefined>(
    (location.state as { acreditappWarning?: string } | null)?.acreditappWarning
  );

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  useEffect(() => {
    const warning = (location.state as { acreditappWarning?: string } | null)?.acreditappWarning;
    if (warning) {
      setAcreditappWarning(warning);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);
  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => listProposals(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!event?.id || !event.updatedAt) return;
    const hadChanges = hasEventUnseenChangesForUser(
      user?.role,
      event,
      proposals.map((p) => ({
        id: p.id,
        categoria: p.categoria,
        titulo: p.titulo,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      }))
    );
    setShowChangeAlert(hadChanges);
    markSeen("event", event.id, event.updatedAt);
  }, [event?.id, event?.updatedAt, event?.createdAt, proposals, user?.role]);

  // Al leer el historial de cambios se dan por vistos los requerimientos.
  useEffect(() => {
    if (tab !== "cambios") return;
    proposals.forEach((p: Proposal) => markSeen("proposal", p.id, p.updatedAt));
    setShowChangeAlert(false);
  }, [tab, proposals]);

  const { data: attachments = [], isLoading: loadingAttachments } = useQuery({
    queryKey: ["attachments", id],
    queryFn: () => listAttachments(id!),
    enabled: !!id && tab === "documentos",
  });

  const aprobadas = proposals.filter((p: Proposal) => p.estado === "APPROVED");
  const pendientes = proposals.filter((p: Proposal) => p.estado === "DRAFT" || p.estado === "SUBMITTED");
  const rechazadas = proposals.filter((p: Proposal) => p.estado === "REJECTED");

  const filtered = proposals.filter((p: Proposal) => {
    if (filterEstado && p.estado !== filterEstado) return false;
    if (filterCategoria && p.categoria !== filterCategoria) return false;
    return true;
  });

  const qc = useQueryClient();
  const updateResumen = useMutation({
    mutationFn: (resumen: string) => updateEvent(id!, { resumen: resumen || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", id] });
      setEditingResumen(false);
    },
  });
  const updateEventMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateEvent>[1]) => updateEvent(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", id] });
      qc.invalidateQueries({ queryKey: ["events"] });
      setConfirmEstado(null);
      setMotivoCancelacion("");
      setRealizacionAsistentes("");
      setRealizacionImpacto("");
    },
  });
  const generarBrief = useMutation({
    mutationFn: () => generarBriefIA(id!),
    onSuccess: async (data) => {
      setBriefGenerado(data.brief);
      setResumenDraft(data.brief);
      setEditingResumen(false);
      setShowBriefModal(true);
      await qc.invalidateQueries({ queryKey: ["event", id] });
      // Entrega el brief AC con la sinopsis recién generada
      setExportandoAc(true);
      try {
        await exportarBriefAcDocx(id!, `Brief reducido AC - ${event?.titulo ?? "Evento"}`);
      } catch (error) {
        console.error(error);
      } finally {
        setExportandoAc(false);
      }
    },
  });
  const deleteEventMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      navigate("/");
    },
  });

  const syncAcreditapp = useMutation({
    mutationFn: () => syncAcreditappEvent(id!),
    onSuccess: () => {
      setAcreditappWarning(undefined);
      qc.invalidateQueries({ queryKey: ["event", id] });
    },
  });

  const handleExportAc = async () => {
    setExportandoAc(true);
    try {
      await exportarBriefAcDocx(id!, `Brief reducido AC - ${event?.titulo ?? "Evento"}`);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setExportandoAc(false);
    }
  };

  const handleShowChanges = () => {
    setTab("cambios");
    window.setTimeout(() => {
      document.getElementById("detalle-operativo")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  if (loadingEvent || !event) {
    return <DetailSkeleton />;
  }

  const tabs = [
    { id: "estado", label: "Estado" },
    { id: "requerimientos", label: "Requerimientos" },
    { id: "aprobaciones", label: "Aprobaciones" },
    { id: "documentos", label: "Documentos" },
    { id: "cambios", label: "Cambios" },
  ];

  const publicoLabel =
    event.publico === "EXTERNO"
      ? "Externo"
      : event.publico === "INTERNO"
        ? "Interno"
        : event.publico === "MIXTO"
          ? "Mixto"
          : null;
  const subtitleParts = [event.areaSolicitante, publicoLabel, formatEventDate(event.fechaTentativa)].filter(Boolean);

  const handleGoToTab = (targetTab: "estado" | "requerimientos", filterEstado?: ProposalStatus) => {
    setTab(targetTab);
    if (filterEstado !== undefined) setFilterEstado(filterEstado);
  };

  const pending = getEventPendingForUser(user?.role, {
    proposals: proposals.map((p) => ({
      id: p.id,
      categoria: p.categoria,
      titulo: p.titulo,
      estado: p.estado,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    })),
    areaChecklist: event.areaChecklist,
  });

  return (
    <div className="page-container max-w-6xl">
      <PageHeader
        breadcrumb={
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Eventos
          </Link>
        }
        title={event.titulo}
        subtitle={subtitleParts.join(" · ")}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEditEvent(user, event) && (
            <Link to={`/events/${id}/edit`}>
              <Button variant="secondary" size="sm">Editar evento</Button>
            </Link>
            )}
            {canConfirmEvent(user) && event.estado !== "CONFIRMADO" && event.estado !== "CANCELADO" && event.estado !== "REALIZADO" && (
              <Button size="sm" onClick={() => setConfirmEstado("CONFIRMADO")}>
                Confirmar evento
              </Button>
            )}
            {canConfirmEvent(user) && (event.estado === "CONFIRMADO" || event.estado === "EN_ANALISIS" || event.estado === "PENDIENTE" || event.estado === "EN_RADAR") && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setConfirmEstado("REALIZADO")}>
                  Marcar como realizado
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => setConfirmEstado("CANCELADO")}>
                  Cancelar evento
                </Button>
              </>
            )}
            {canDeleteEvent(user) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                Eliminar
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StatusBadge kind="event" value={event.estado as EventStatus} />
        {event._count && (
          <span className="text-sm text-slate-500">{event._count.proposals} requerimientos</span>
        )}
      </div>

      {event.areaChecklist && event.areaChecklist.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Involucrados
          </span>
          <AreaChecklistChips
            items={event.areaChecklist}
            highlightAreaRole={areaRoleForUser(user?.role)}
          />
          {pending.areasPendientes > 0 && (
            <span className="text-xs text-slate-500">
              {pending.areasPendientes} de {event.areaChecklist.length} sin decidir
            </span>
          )}
          <button
            type="button"
            onClick={() => setTab("aprobaciones")}
            className="text-xs font-medium text-brand-600 underline"
          >
            Ver aprobaciones
          </button>
        </div>
      )}

      {(pending.faltaMiAprobacion || pending.porValidar > 0) && (
        <div
          className="mb-6 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-900"
          role="status"
        >
          <p className="font-medium">
            {pending.faltaMiAprobacion
              ? "Tu área todavía no marcó su aprobación en este evento."
              : `Hay ${pending.porValidar} requerimiento(s) esperando validación.`}
          </p>
          <p className="mt-0.5 text-brand-800">
            {pending.faltaMiAprobacion ? (
              <button
                type="button"
                onClick={() => setTab("aprobaciones")}
                className="font-medium underline"
              >
                Ir a Aprobaciones
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleGoToTab("requerimientos", "SUBMITTED")}
                className="font-medium underline"
              >
                Ver requerimientos enviados
              </button>
            )}
          </p>
        </div>
      )}

      {(showChangeAlert ||
        proposals.some(
          (p) =>
            proposalRelevantToRole(user?.role, p) &&
            hasUnseenChanges("proposal", p.id, p.updatedAt, p.createdAt)
        )) && (
        <div
          className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Hay cambios recientes en este evento o sus requerimientos.</p>
          <p className="mt-0.5 text-amber-800">
            Mirálos en la sección{" "}
            <button
              type="button"
              onClick={handleShowChanges}
              className="font-medium underline"
            >
              Cambios
            </button>
            .
          </p>
        </div>
      )}

      <EventOverview
        event={event}
        user={user}
        editingResumen={editingResumen}
        resumenDraft={resumenDraft}
        onStartEditResumen={() => {
          setResumenDraft(event.resumen ?? "");
          setEditingResumen(true);
        }}
        onResumenChange={setResumenDraft}
        onSaveResumen={() => updateResumen.mutate(resumenDraft)}
        onCancelEditResumen={() => {
          setEditingResumen(false);
          setResumenDraft(event.resumen ?? "");
        }}
        savingResumen={updateResumen.isPending}
        resumenError={
          updateResumen.error instanceof Error ? updateResumen.error.message : undefined
        }
        onGenerateBrief={() => generarBrief.mutate()}
        generatingBrief={generarBrief.isPending}
        briefError={
          generarBrief.error instanceof Error ? generarBrief.error.message : undefined
        }
        onExportAc={handleExportAc}
        exportingAc={exportandoAc}
        canSyncAcreditapp={canEditEvent(user, event)}
        onSyncAcreditapp={() => syncAcreditapp.mutate()}
        syncingAcreditapp={syncAcreditapp.isPending}
        acreditappWarning={acreditappWarning}
        acreditappSyncError={
          syncAcreditapp.error instanceof Error ? syncAcreditapp.error.message : undefined
        }
      />

      <div id="detalle-operativo" className="mb-6 scroll-mt-4">
        <Tabs tabs={tabs} active={tab} onChange={(nextTab) => setTab(nextTab as EventDetailTab)} />
      </div>

      {tab === "estado" && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Aprobadas"
              value={aprobadas.length}
              accent="green"
              subtitle="Listas para brief"
            />
            <StatCard
              label="Pendientes"
              value={pendientes.length}
              accent="amber"
              subtitle="Requieren validación"
            />
            <StatCard
              label="Rechazadas"
              value={rechazadas.length}
              accent="red"
              subtitle="Con motivo registrado"
            />
            <StatCard
              label="Completitud"
              value={`${proposals.length ? Math.round((aprobadas.length / proposals.length) * 100) : 0}%`}
              accent="blue"
              subtitle="Requerimientos aprobados"
            />
          </div>

          <EventHealthChecklist
            eventId={id!}
            eventTitle={event.titulo}
            proposals={proposals}
            loading={loadingProposals}
            onGoToTab={handleGoToTab}
          />

          <p className="text-slate-600 text-sm">
            Qué está aprobado, qué está pendiente y qué fue rechazado.
          </p>

          {loadingProposals ? (
            <div className="py-8 text-center text-slate-600">Cargando requerimientos…</div>
          ) : (
            <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <div className="kanban-column border-emerald-200/60">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Información aprobada ({aprobadas.length})
                </h3>
                {aprobadas.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Ningún requerimiento aprobado aún.</p>
                ) : (
                  <div className="space-y-3">
                    {aprobadas.map((p: Proposal) => (
                      <ProposalCard key={p.id} proposal={p} variant="kanban" accent="green" />
                    ))}
                  </div>
                )}
              </div>

              <div className="kanban-column border-amber-200/60">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pendiente de validación ({pendientes.length})
                </h3>
                {pendientes.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Nada pendiente.</p>
                ) : (
                  <div className="space-y-3">
                    {pendientes.map((p: Proposal) => (
                      <ProposalCard key={p.id} proposal={p} variant="kanban" accent="amber" />
                    ))}
                  </div>
                )}
              </div>

              <div className="kanban-column border-red-200/60">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Rechazado ({rechazadas.length})
                </h3>
                {rechazadas.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Ningún requerimiento rechazado.</p>
                ) : (
                  <div className="space-y-3">
                    {rechazadas.map((p: Proposal) => (
                      <ProposalCard key={p.id} proposal={p} variant="kanban" accent="red" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {tab === "requerimientos" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Requerimientos</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Una tarjeta por tipo. Si ya existe, editá el requerimiento en lugar de crear otro.
              </p>
            </div>
            {canCreateProposal(user) && (
              <Button
                size="sm"
                onClick={() =>
                  document.getElementById("new-proposal-form")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Nuevo requerimiento
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
            <Select
              options={[
                { value: "", label: "Todos los estados" },
                ...(Object.entries(proposalStatusLabels) as [ProposalStatus, string][]).map(
                  ([v, l]) => ({ value: v, label: l })
                ),
              ]}
              value={filterEstado}
              onChange={(e) => setFilterEstado((e.target.value || "") as ProposalStatus)}
              className="w-full sm:w-44"
            />
            <Select
              options={[
                { value: "", label: "Todas las categorías" },
                ...(Object.entries(categoryLabels) as [ProposalCategory, string][]).map(
                  ([v, l]) => ({ value: v, label: l })
                ),
              ]}
              value={filterCategoria}
              onChange={(e) => setFilterCategoria((e.target.value || "") as ProposalCategory)}
              className="w-full sm:w-44"
            />
          </div>
          {loadingProposals ? (
            <div className="py-8 text-center text-slate-600">Cargando…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No hay requerimientos"
              description="Creá un requerimiento por tipo. Si ya existe ese tipo, editá la tarjeta correspondiente."
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p: Proposal) => (
                <ProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          )}
          {canCreateProposal(user) && (
            <NewProposalForm
              eventId={id!}
              occupiedCategories={proposals.map((p: Proposal) => p.categoria)}
            />
          )}
        </div>
      )}

      {tab === "aprobaciones" && (
        <div className="mt-6">
          <AreaDecisionsPanel
            eventId={id!}
            user={user}
            funcionario={(event as { funcionario?: string | null }).funcionario}
            productor={(event as { productor?: string | null }).productor}
            tieneProduccion={/producci[oó]n/i.test(event.tipoEvento)}
          />
        </div>
      )}

      {tab === "documentos" && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <span className="flex items-center gap-2">
                <span className="text-lg">📎</span>
                Documentos PDF
              </span>
            </CardHeader>
            <CardBody>
              <DocumentosSection eventId={id!} attachments={attachments.filter((a) => a.tipo !== "impacto")} isLoading={loadingAttachments} />
              {event.estado === "REALIZADO" && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">PDF de métricas de impacto</h4>
                  <DocumentosSection eventId={id!} attachments={attachments.filter((a) => a.tipo === "impacto")} isLoading={loadingAttachments} tipo="impacto" title="Archivo de impacto (opcional)" />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "cambios" && (
        <div className="mt-6">
          <EventChangesPanel
            eventId={id!}
            highlight={
              showChangeAlert ||
              proposals.some((p) =>
                hasUnseenChanges("proposal", p.id, p.updatedAt, p.createdAt)
              )
            }
          />
        </div>
      )}

      <Modal
        title="Brief generado con IA"
        subtitle="Sinopsis armada y aplicada. El brief reducido AC se descargó automáticamente."
        open={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        size="xl"
      >
        <div className="flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
            <div className="p-6 space-y-4">
              <div className="bg-sidebar text-white px-5 py-4 rounded-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" aria-hidden />
                <p className="font-semibold">Sinopsis: {event.titulo}</p>
              </div>
              {briefGenerado
                .split(/\n\n+/)
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className="text-slate-700 text-[15px] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>
          <div className="stack-actions sm:justify-end pt-4 mt-4 border-t border-slate-100 [&_button]:w-full [&_button]:sm:w-auto">
            <Button variant="secondary" onClick={() => setShowBriefModal(false)}>
              Cerrar
            </Button>
            <Button
              disabled={exportandoAc}
              onClick={handleExportAc}
            >
              <FileDown className="w-4 h-4" aria-hidden />
              {exportandoAc ? "Exportando…" : "Volver a descargar AC"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={confirmEstado === "CANCELADO" ? "Cancelar evento" : confirmEstado === "REALIZADO" ? "Marcar como realizado" : "Confirmar evento"}
        open={!!confirmEstado}
        onClose={() => { setConfirmEstado(null); setMotivoCancelacion(""); setRealizacionAsistentes(""); setRealizacionImpacto(""); setRealizacionLinkImpacto(""); setRealizacionPdfFile(null); }}
      >
        {confirmEstado && (
          <div className="space-y-4">
            {confirmEstado === "CANCELADO" && (
              <>
                <p className="text-slate-600">
                  Indicá el motivo o razón de la cancelación (obligatorio).
                </p>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Ej: Cambio de fecha, falta de presupuesto..."
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                />
              </>
            )}
            {confirmEstado === "REALIZADO" && (
              <>
                <p className="text-slate-600">
                  Cargá datos del evento realizado (opcional pero recomendado).
                </p>
                <div className="grid gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Cantidad de asistentes
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Ej: 120"
                    value={realizacionAsistentes}
                    onChange={(e) => setRealizacionAsistentes(e.target.value)}
                  />
                  <label className="block text-sm font-medium text-slate-700">
                    Impacto / comentarios
                  </label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[60px]"
                    placeholder="Breve descripción del impacto o resultado del evento"
                    value={realizacionImpacto}
                    onChange={(e) => setRealizacionImpacto(e.target.value)}
                  />
                  <label className="block text-sm font-medium text-slate-700">
                    Link a PDF o recurso de impacto (opcional)
                  </label>
                  <input
                    type="url"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="https://..."
                    value={realizacionLinkImpacto}
                    onChange={(e) => setRealizacionLinkImpacto(e.target.value)}
                  />
                  <label className="block text-sm font-medium text-slate-700">
                    Subir PDF de métricas (opcional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gov-100 file:text-gov-800"
                    onChange={(e) => setRealizacionPdfFile(e.target.files?.[0] ?? null)}
                  />
                  {realizacionPdfFile && (
                    <p className="text-xs text-slate-500">{realizacionPdfFile.name}</p>
                  )}
                </div>
              </>
            )}
            {confirmEstado !== "CANCELADO" && confirmEstado !== "REALIZADO" && (
              <p className="text-slate-600">
                ¿Marcar este evento como {eventStatusLabels[confirmEstado].toLowerCase()}?
              </p>
            )}
            <div className="stack-actions sm:justify-end [&_button]:w-full [&_button]:sm:w-auto">
              <Button variant="secondary" onClick={() => { setConfirmEstado(null); setMotivoCancelacion(""); setRealizacionAsistentes(""); setRealizacionImpacto(""); setRealizacionLinkImpacto(""); setRealizacionPdfFile(null); }}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (confirmEstado === "CANCELADO") {
                    if (!motivoCancelacion.trim()) return;
                    updateEventMutation.mutate({ estado: "CANCELADO", motivoCancelacion: motivoCancelacion.trim() });
                  } else if (confirmEstado === "REALIZADO") {
                    const asistentes = realizacionAsistentes.trim() ? parseInt(realizacionAsistentes, 10) : undefined;
                    const link = realizacionLinkImpacto.trim() || undefined;
                    const file = realizacionPdfFile;
                    updateEventMutation.mutate(
                      {
                        estado: "REALIZADO",
                        realizacionAsistentes: asistentes != null && !Number.isNaN(asistentes) ? asistentes : undefined,
                        realizacionImpacto: realizacionImpacto.trim() || undefined,
                        realizacionLinkImpacto: link,
                      },
                      {
                        onSuccess: async () => {
                          qc.invalidateQueries({ queryKey: ["event", id] });
                          if (file && id) {
                            try {
                              await uploadAttachment(id, file, "impacto");
                              qc.invalidateQueries({ queryKey: ["attachments", id] });
                            } catch (e) {
                              console.error(e);
                            }
                          }
                          setConfirmEstado(null);
                          setRealizacionAsistentes("");
                          setRealizacionImpacto("");
                          setRealizacionLinkImpacto("");
                          setRealizacionPdfFile(null);
                        },
                      }
                    );
                  } else {
                    updateEventMutation.mutate({ estado: confirmEstado });
                  }
                }}
                disabled={updateEventMutation.isPending || (confirmEstado === "CANCELADO" && !motivoCancelacion.trim())}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Eliminar evento"
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            ¿Estás seguro de que querés eliminar este evento? Se eliminarán también todos los requerimientos y adjuntos asociados. Esta acción no se puede deshacer.
          </p>
          <div className="stack-actions sm:justify-end [&_button]:w-full [&_button]:sm:w-auto">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteEventMutation.mutate()}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DocumentosSection({
  eventId,
  attachments,
  isLoading,
  tipo = "documento",
  title,
}: {
  eventId: string;
  attachments: EventAttachment[];
  isLoading: boolean;
  tipo?: "documento" | "impacto";
  title?: string;
}) {
  const qc = useQueryClient();
  const upload = useMutation({
    mutationFn: (file: File) => uploadAttachment(eventId, file, tipo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", eventId] });
    },
    onError: (e: Error) => setUploadError(e.message),
  });
  const remove = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(eventId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", eventId] });
    },
  });
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Solo se permiten archivos PDF");
      return;
    }
    setUploadError("");
    upload.mutate(file);
    e.target.value = "";
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="py-6 text-center text-slate-600">Cargando documentos…</div>;
  }

  return (
    <div className="space-y-4">
      {title && <p className="text-sm font-medium text-slate-700">{title}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gov-600 text-white hover:bg-gov-700 focus:outline-none focus:ring-2 focus:ring-gov-500 focus:ring-offset-2 disabled:opacity-50">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={upload.isPending}
          />
          <span>{upload.isPending ? "Subiendo…" : tipo === "impacto" ? "Subir PDF de impacto" : "Subir PDF"}</span>
        </label>
        <span className="text-slate-500 text-sm">Máx. 10 MB por archivo</span>
      </div>
      {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
      {upload.error && !uploadError && (
        <p className="text-red-600 text-sm">{upload.error.message}</p>
      )}
      {attachments.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">{tipo === "impacto" ? "No hay archivo de impacto. Podés subir un PDF con las métricas." : "No hay documentos subidos. Subí un PDF para comenzar."}</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
            >
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => openAttachment(eventId, a.id, a.originalName)}
                  className="text-slate-800 font-medium hover:text-gov-600 truncate block text-left"
                >
                  📄 {a.originalName}
                </button>
                {a.size != null && (
                  <span className="text-slate-500 text-xs">{formatSize(a.size)}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAttachment(eventId, a.id, a.originalName)}
                >
                  Descargar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove.mutate(a.id)}
                  disabled={remove.isPending}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewProposalForm({
  eventId,
  occupiedCategories,
}: {
  eventId: string;
  occupiedCategories: ProposalCategory[];
}) {
  const categoriesDisponibles = (Object.keys(categoryLabels) as ProposalCategory[]).filter(
    (c) => !occupiedCategories.includes(c)
  );
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<ProposalCategory>(categoriesDisponibles[0] ?? "OTRO");
  const [datosExtra, setDatosExtra] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: {
      titulo: string;
      descripcion: string;
      categoria?: string;
      impacto?: string;
      datosExtra?: Record<string, string>;
    }) => createProposal(eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals", eventId] });
      setTitulo("");
      setDescripcion("");
      setDatosExtra({});
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (occupiedCategories.includes(categoria)) {
      setError("Ya existe un requerimiento de este tipo. Editá la tarjeta existente.");
      return;
    }
    create.mutate({
      titulo: titulo.trim() || categoryLabels[categoria],
      descripcion,
      categoria,
      datosExtra: Object.keys(datosExtra).length > 0 ? datosExtra : undefined,
    });
  };

  const handleCategoriaChange = (newCat: ProposalCategory) => {
    setCategoria(newCat);
    setDatosExtra({});
    if (!titulo.trim() || Object.values(categoryLabels).includes(titulo)) {
      setTitulo(categoryLabels[newCat]);
    }
  };

  const categoryOptions = categoriesDisponibles.map((value) => ({
    value,
    label: categoryLabels[value],
  }));

  const extraFields = categoryExtraFields[categoria] ?? [];

  if (categoriesDisponibles.length === 0) {
    return (
      <Card className="mt-8">
        <CardBody className="py-6">
          <p className="text-sm text-slate-600">
            Ya hay un requerimiento por cada tipo. Para cambios, abrí la tarjeta correspondiente y editá el requerimiento existente.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div id="new-proposal-form">
    <Card className="mt-8">
      <CardHeader>Nuevo requerimiento</CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select
            label="Tipo de requerimiento"
            options={categoryOptions}
            value={categoria}
            onChange={(e) => handleCategoriaChange(e.target.value as ProposalCategory)}
          />
          <Input
            label="Título"
            placeholder="Título del requerimiento"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
          <TextArea
            label="Descripción"
            placeholder="Detalle de lo que se necesita"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            rows={3}
          />
          {extraFields.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-600">
                Datos adicionales para {categoryLabels[categoria]}
              </p>
              {extraFields.map((field) => (
                <div key={field.key}>
                  {field.type === "textarea" ? (
                    <TextArea
                      label={field.label}
                      placeholder={field.placeholder}
                      value={datosExtra[field.key] ?? ""}
                      onChange={(e) =>
                        setDatosExtra((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      rows={2}
                    />
                  ) : field.type === "select" && field.options?.length ? (
                    <Select
                      label={field.label}
                      options={field.options}
                      value={datosExtra[field.key] ?? ""}
                      onChange={(e) =>
                        setDatosExtra((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <Input
                      label={field.label}
                      placeholder={field.placeholder}
                      value={datosExtra[field.key] ?? ""}
                      onChange={(e) =>
                        setDatosExtra((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creando…" : "Crear requerimiento"}
          </Button>
        </form>
      </CardBody>
    </Card>
    </div>
  );
}
