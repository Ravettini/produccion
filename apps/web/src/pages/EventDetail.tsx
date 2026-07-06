import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, FileDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvent, updateEvent, deleteEvent } from "../api/events";
import { listProposals, createProposal } from "../api/proposals";
import { generarBriefIA, exportarBriefDocx } from "../api/ai";
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
import { formatDate } from "../utils/formatters";
import { EventHealthChecklist } from "../components/event/EventHealthChecklist";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"brief" | "estado" | "propuestas" | "documentos">("brief");
  const [filterEstado, setFilterEstado] = useState<ProposalStatus | "">("");
  const [filterCategoria, setFilterCategoria] = useState<ProposalCategory | "">("");
  const [editingResumen, setEditingResumen] = useState(false);
  const [resumenDraft, setResumenDraft] = useState("");
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [briefGenerado, setBriefGenerado] = useState("");
  const [exportandoDocx, setExportandoDocx] = useState(false);
  const [confirmEstado, setConfirmEstado] = useState<EventStatus | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [realizacionAsistentes, setRealizacionAsistentes] = useState<string>("");
  const [realizacionImpacto, setRealizacionImpacto] = useState("");
  const [realizacionLinkImpacto, setRealizacionLinkImpacto] = useState("");
  const [realizacionPdfFile, setRealizacionPdfFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });
  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => listProposals(id!),
    enabled: !!id,
  });
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
    onSuccess: (data) => {
      setBriefGenerado(data.brief);
      setShowBriefModal(true);
    },
  });
  const deleteEventMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      navigate("/");
    },
  });

  if (loadingEvent || !event) {
    return <DetailSkeleton />;
  }

  const tabs = [
    { id: "brief", label: "Brief" },
    { id: "estado", label: "Estado de la información" },
    { id: "propuestas", label: "Propuestas" },
    { id: "documentos", label: "Documentos" },
  ];

  const publicoLabel =
    event.publico === "EXTERNO"
      ? "Externo"
      : event.publico === "INTERNO"
        ? "Interno"
        : event.publico === "MIXTO"
          ? "Mixto"
          : null;
  const subtitleParts = [event.areaSolicitante, publicoLabel, formatDate(event.fechaTentativa)].filter(Boolean);

  const handleGoToTab = (targetTab: "estado" | "propuestas", filterEstado?: ProposalStatus) => {
    setTab(targetTab);
    if (filterEstado !== undefined) setFilterEstado(filterEstado);
  };

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
            {canConfirmEvent(user) && (event.estado === "CONFIRMADO" || event.estado === "EN_ANALISIS" || event.estado === "BORRADOR") && (
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge kind="event" value={event.estado as EventStatus} />
        {event._count && (
          <span className="text-sm text-slate-500">{event._count.proposals} propuestas</span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Aprobadas" value={aprobadas.length} accent="green" subtitle="Listas para brief" />
        <StatCard label="Pendientes" value={pendientes.length} accent="amber" subtitle="Requieren validación" />
        <StatCard label="Rechazadas" value={rechazadas.length} accent="red" subtitle="Con motivo registrado" />
        <StatCard
          label="Completitud"
          value={`${proposals.length ? Math.round((aprobadas.length / proposals.length) * 100) : 0}%`}
          accent="blue"
          subtitle="Propuestas aprobadas"
        />
      </div>

      {/* Event Health / Checklist */}
      <div className="mb-6">
        <EventHealthChecklist
          eventId={id!}
          eventTitle={event.titulo}
          proposals={proposals}
          loading={loadingProposals}
          onGoToTab={handleGoToTab}
        />
      </div>

      <div className="mb-6">
        <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as typeof tab)} />
      </div>

      {tab === "brief" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              action={
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={exportandoDocx}
                    onClick={async () => {
                      setExportandoDocx(true);
                      try {
                        await exportarBriefDocx(id!, `Brief - ${event.titulo}`);
                      } catch (e) {
                        console.error(e);
                        alert((e as Error).message);
                      } finally {
                        setExportandoDocx(false);
                      }
                    }}
                  >
                    {exportandoDocx ? "Exportando…" : "Exportar brief DOCX"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generarBrief.mutate()}
                    disabled={generarBrief.isPending}
                  >
                    {generarBrief.isPending ? "Generando…" : "Generar brief con IA"}
                  </Button>
                </div>
              }
            >
              Resumen y brief
            </CardHeader>
            <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Descripción</h3>
                <p className="text-slate-800 mt-1 whitespace-pre-wrap">{event.descripcion}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Requiere</h3>
                  <p className="text-slate-800">{event.tipoEvento}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Área solicitante</h3>
                  <p className="text-slate-800">{event.areaSolicitante}</p>
                </div>
                {event.usuarioSolicitante && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Usuario solicitante</h3>
                    <p className="text-slate-800">{event.usuarioSolicitante}</p>
                  </div>
                )}
                {event.publico && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Público</h3>
                    <p className="text-slate-800">
                      {event.publico === "EXTERNO" ? "Externo" : event.publico === "INTERNO" ? "Interno" : "Mixto"}
                    </p>
                  </div>
                )}
                {(event as { programa?: string | null }).programa && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Programa</h3>
                    <p className="text-slate-800">{(event as { programa?: string | null }).programa}</p>
                  </div>
                )}
                {(event as { funcionario?: string | null }).funcionario && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Funcionario(s)</h3>
                    <p className="text-slate-800">{(event as { funcionario?: string | null }).funcionario}</p>
                  </div>
                )}
                {(event as { necesitaAcreditacion?: boolean | null }).necesitaAcreditacion != null && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">¿Se necesita acreditación?</h3>
                    <p className="text-slate-800">{(event as { necesitaAcreditacion?: boolean }).necesitaAcreditacion ? "Sí" : "No"}</p>
                  </div>
                )}
                {(event as { linkAcreditacionConvocados?: string | null }).linkAcreditacionConvocados && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Link a convocados para acreditar</h3>
                    <a href={(event as { linkAcreditacionConvocados: string }).linkAcreditacionConvocados} target="_blank" rel="noopener noreferrer" className="text-gov-600 hover:underline truncate block">
                      {(event as { linkAcreditacionConvocados: string }).linkAcreditacionConvocados}
                    </a>
                  </div>
                )}
              </div>
              {event.resumen && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Resumen</h3>
                  <p className="text-slate-800 mt-1 whitespace-pre-wrap">{event.resumen}</p>
                </div>
              )}
              {event.estado === "CANCELADO" && (event as { motivoCancelacion?: string | null }).motivoCancelacion && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <h3 className="text-sm font-medium text-red-800">Motivo de cancelación</h3>
                  <p className="text-red-900 mt-1 whitespace-pre-wrap">{(event as { motivoCancelacion: string }).motivoCancelacion}</p>
                </div>
              )}
              {event.estado === "REALIZADO" && ((event as { realizacionAsistentes?: number | null }).realizacionAsistentes != null || (event as { realizacionImpacto?: string | null }).realizacionImpacto || (event as { realizacionLinkImpacto?: string | null }).realizacionLinkImpacto) && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <h3 className="text-sm font-medium text-blue-800">Datos del evento realizado</h3>
                  <div className="mt-2 space-y-1 text-blue-900">
                    {(event as { realizacionAsistentes?: number | null }).realizacionAsistentes != null && (
                      <p><strong>Asistentes:</strong> {(event as { realizacionAsistentes: number }).realizacionAsistentes}</p>
                    )}
                    {(event as { realizacionImpacto?: string | null }).realizacionImpacto && (
                      <p className="whitespace-pre-wrap"><strong>Impacto:</strong> {(event as { realizacionImpacto: string }).realizacionImpacto}</p>
                    )}
                    {(event as { realizacionLinkImpacto?: string | null }).realizacionLinkImpacto && (
                      <p>
                        <strong>Link PDF / recurso:</strong>{" "}
                        <a href={(event as { realizacionLinkImpacto: string }).realizacionLinkImpacto} target="_blank" rel="noopener noreferrer" className="underline">
                          {(event as { realizacionLinkImpacto: string }).realizacionLinkImpacto}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!event.resumen && (
                <p className="text-slate-500 text-sm italic">
                  Sin resumen. Generá uno con IA o agregalo desde la pestaña Estado de la información.
                </p>
              )}
            </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "estado" && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader
              action={
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={exportandoDocx}
                    onClick={async () => {
                      setExportandoDocx(true);
                      try {
                        await exportarBriefDocx(id!, `Brief - ${event.titulo}`);
                      } catch (e) {
                        console.error(e);
                        alert((e as Error).message);
                      } finally {
                        setExportandoDocx(false);
                      }
                    }}
                  >
                    {exportandoDocx ? "Exportando…" : "Exportar brief DOCX"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generarBrief.mutate()}
                    disabled={generarBrief.isPending}
                  >
                    {generarBrief.isPending ? "Generando…" : "Generar brief con IA"}
                  </Button>
                  {!editingResumen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResumenDraft(event.resumen ?? "");
                        setEditingResumen(true);
                      }}
                    >
                      {event.resumen ? "Editar resumen" : "Agregar resumen"}
                    </Button>
                  )}
                </div>
              }
            >
              Resumen
            </CardHeader>
            <CardBody>
              {editingResumen ? (
                <div className="space-y-3">
                  <TextArea
                    value={resumenDraft}
                    onChange={(e) => setResumenDraft(e.target.value)}
                    rows={4}
                    placeholder="El evento se va a hacer en [lugar], se necesita producción [detalle], catering [detalle]..."
                  />
                  {generarBrief.error && (
                    <p className="text-red-600 text-sm">{generarBrief.error.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateResumen.mutate(resumenDraft)}
                      disabled={updateResumen.isPending}
                    >
                      {updateResumen.isPending ? "Guardando…" : "Guardar"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingResumen(false);
                        setResumenDraft(event.resumen ?? "");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                  {updateResumen.error && (
                    <p className="text-red-600 text-sm">{updateResumen.error.message}</p>
                  )}
                </div>
              ) : event.resumen ? (
                <p className="text-slate-800 whitespace-pre-wrap">{event.resumen}</p>
              ) : (
                <p className="text-slate-500 text-sm italic">
                  Sin resumen. Podés agregar un texto o generar uno con IA.
                </p>
              )}
            </CardBody>
          </Card>

          <p className="text-slate-600 text-sm">
            Qué está aprobado, qué está pendiente y qué fue rechazado.
          </p>

          {loadingProposals ? (
            <div className="py-8 text-center text-slate-600">Cargando propuestas…</div>
          ) : (
            <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="kanban-column border-emerald-200/60">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Información aprobada ({aprobadas.length})
                </h3>
                {aprobadas.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Ninguna propuesta aprobada aún.</p>
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
                  <p className="text-slate-500 text-sm italic">Ninguna propuesta rechazada.</p>
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

      {tab === "propuestas" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Propuestas</h2>
            {canCreateProposal(user) && (
              <Button
                size="sm"
                onClick={() =>
                  document.getElementById("new-proposal-form")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Nueva propuesta
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Select
              options={[
                { value: "", label: "Todos los estados" },
                ...(Object.entries(proposalStatusLabels) as [ProposalStatus, string][]).map(
                  ([v, l]) => ({ value: v, label: l })
                ),
              ]}
              value={filterEstado}
              onChange={(e) => setFilterEstado((e.target.value || "") as ProposalStatus)}
              className="w-40"
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
              className="w-44"
            />
          </div>
          {loadingProposals ? (
            <div className="py-8 text-center text-slate-600">Cargando…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No hay propuestas"
              description="Creá una desde el formulario de abajo."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p: Proposal) => (
                <ProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          )}
          {canCreateProposal(user) && <NewProposalForm eventId={id!} />}
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

      <Modal
        title="Brief generado con IA"
        subtitle="Generado a partir del evento y propuestas aprobadas"
        open={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        size="xl"
      >
        <div className="flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
            <div className="p-6 space-y-4">
              <div className="bg-sidebar text-white px-5 py-4 rounded-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" aria-hidden />
                <p className="font-semibold">Brief de evento: {event.titulo}</p>
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
          <div className="flex gap-2 justify-end flex-wrap pt-4 mt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowBriefModal(false)}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              disabled={exportandoDocx}
              onClick={async () => {
                setExportandoDocx(true);
                try {
                  await exportarBriefDocx(id!, `Brief - ${event.titulo}`);
                } catch (e) {
                  console.error(e);
                  alert((e as Error).message);
                } finally {
                  setExportandoDocx(false);
                }
              }}
            >
              <FileDown className="w-4 h-4" aria-hidden />
              {exportandoDocx ? "Exportando…" : "Exportar como documento de Word"}
            </Button>
            <Button
              onClick={() => {
                updateResumen.mutate(briefGenerado);
                setShowBriefModal(false);
              }}
              disabled={updateResumen.isPending}
            >
              {updateResumen.isPending ? "Guardando…" : "Usar como resumen"}
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
            <div className="flex gap-2 justify-end">
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
            ¿Estás seguro de que querés eliminar este evento? Se eliminarán también todas las propuestas y adjuntos asociados. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end">
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

function NewProposalForm({ eventId }: { eventId: string }) {
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<ProposalCategory>("OTRO");
  const [impacto, setImpacto] = useState<"ALTO" | "MEDIO" | "BAJO">("MEDIO");
  const [datosExtra, setDatosExtra] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: {
      titulo: string;
      nombreProyecto?: string;
      descripcion: string;
      categoria?: string;
      impacto?: string;
      datosExtra?: Record<string, string>;
    }) => createProposal(eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals", eventId] });
      setNombreProyecto("");
      setTitulo("");
      setDescripcion("");
      setDatosExtra({});
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extra = Object.keys(datosExtra).length > 0 ? datosExtra : undefined;
    create.mutate({
      titulo,
      nombreProyecto: nombreProyecto.trim() || undefined,
      descripcion,
      categoria,
      impacto,
      datosExtra: extra,
    });
  };

  const handleCategoriaChange = (newCat: ProposalCategory) => {
    setCategoria(newCat);
    setDatosExtra({});
  };

  const categoryOptions = (Object.entries(categoryLabels) as [ProposalCategory, string][]).map(
    ([value, label]) => ({ value, label })
  );

  const extraFields = categoryExtraFields[categoria];

  return (
    <div id="new-proposal-form">
    <Card className="mt-8">
      <CardHeader>Nueva propuesta</CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Nombre del proyecto"
            placeholder="Nombre del proyecto"
            value={nombreProyecto}
            onChange={(e) => setNombreProyecto(e.target.value)}
          />
          <Input
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
          <TextArea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            <Select
              options={categoryOptions}
              value={categoria}
              onChange={(e) => handleCategoriaChange(e.target.value as ProposalCategory)}
              className="flex-1 min-w-[120px]"
            />
            <Select
              options={[
                { value: "ALTO", label: "Alto" },
                { value: "MEDIO", label: "Medio" },
                { value: "BAJO", label: "Bajo" },
              ]}
              value={impacto}
              onChange={(e) => setImpacto(e.target.value as "ALTO" | "MEDIO" | "BAJO")}
              className="flex-1 min-w-[100px]"
            />
          </div>
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
            {create.isPending ? "Creando…" : "Crear propuesta"}
          </Button>
        </form>
      </CardBody>
    </Card>
    </div>
  );
}
