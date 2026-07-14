import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Send, XCircle } from "lucide-react";
import {
  getProposal,
  submitProposal,
  approveProposal,
  rejectProposal,
  cancelProposal,
  addComment,
  updateProposal,
} from "../api/proposals";
import { getAreaDecisions } from "../api/eventDecisions";
import { useAuth } from "../hooks/useAuth";
import {
  canApproveOrRejectProposal,
  canSubmitProposal,
  canCancelProposal,
  canEditProposal,
} from "../hooks/usePermissions";
import type { ProposalStatus, ProposalCategory } from "../types";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Modal,
  TextArea,
  Input,
  DetailSkeleton,
  StatusBadge,
  Badge,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { AuditTimeline } from "../components/domain/AuditTimeline";
import { categoryLabels, categoryColors } from "../utils/labels";
import { categoryExtraFields } from "../config/proposalCategoryFields";
import { formatDateShort } from "../utils/formatters";

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editDatosExtra, setEditDatosExtra] = useState<Record<string, string>>({});

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => getProposal(id!),
    enabled: !!id,
  });

  const eventIdForDecisions = proposal?.eventId;
  const { data: areaDecisions } = useQuery({
    queryKey: ["area-decisions", eventIdForDecisions],
    queryFn: () => getAreaDecisions(eventIdForDecisions!),
    enabled: !!eventIdForDecisions,
  });

  const submit = useMutation({
    mutationFn: () => submitProposal(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
  const approve = useMutation({
    mutationFn: () => approveProposal(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
  const reject = useMutation({
    mutationFn: () => rejectProposal(id!, rejectReason),
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
  const cancel = useMutation({
    mutationFn: () => cancelProposal(id!),
    onSuccess: () => {
      setShowCancelModal(false);
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
      navigate(proposal?.eventId ? `/events/${proposal.eventId}` : "/");
    },
  });
  const postComment = useMutation({
    mutationFn: () => addComment(id!, commentText),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["proposal", id] });
    },
  });
  const saveEdit = useMutation({
    mutationFn: () =>
      updateProposal(id!, {
        titulo: editTitulo,
        descripcion: editDescripcion,
        datosExtra: editDatosExtra,
        editReason: editReason.trim() || undefined,
      } as Parameters<typeof updateProposal>[1] & { editReason?: string }),
    onSuccess: () => {
      setEditing(false);
      setEditReason("");
      qc.invalidateQueries({ queryKey: ["proposal", id] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });

  if (isLoading || !proposal) {
    return <DetailSkeleton />;
  }

  const eventId = proposal.eventId || (proposal.event as { id: string })?.id;
  const eventTitulo = (proposal.event as { titulo?: string })?.titulo ?? "Evento";
  const specialtyCanEdit = Boolean(areaDecisions?.canDecide);
  const allowEdit = canEditProposal(user, proposal, { specialtyCanEdit });

  const startEditing = () => {
    setEditTitulo(proposal.titulo);
    setEditDescripcion(proposal.descripcion);
    let extra: Record<string, string> = {};
    try {
      const raw = proposal.datosExtra;
      if (raw && typeof raw === "string") extra = JSON.parse(raw) as Record<string, string>;
      else if (raw && typeof raw === "object") extra = raw as Record<string, string>;
    } catch {
      extra = {};
    }
    setEditDatosExtra(extra);
    setEditing(true);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const extraFields = categoryExtraFields[proposal.categoria as ProposalCategory] ?? [];

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        breadcrumb={
          <Link
            to={eventId ? `/events/${eventId}` : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {eventTitulo}
          </Link>
        }
        title={proposal.titulo}
        subtitle={proposal.nombreProyecto ? `Proyecto: ${proposal.nombreProyecto}` : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {allowEdit && !editing && (
              <Button variant="secondary" onClick={startEditing}>
                Editar requerimiento
              </Button>
            )}
            {proposal.estado === "DRAFT" && canSubmitProposal(user, proposal) && (
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                <Send className="w-4 h-4" aria-hidden />
                Enviar a validación
              </Button>
            )}
            {proposal.estado === "SUBMITTED" && canApproveOrRejectProposal(user) && (
              <>
                <Button variant="success" onClick={() => approve.mutate()} disabled={approve.isPending}>
                  <CheckCircle2 className="w-4 h-4" aria-hidden />
                  Aprobar requerimiento
                </Button>
                <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                  <XCircle className="w-4 h-4" aria-hidden />
                  Rechazar requerimiento
                </Button>
              </>
            )}
            {canCancelProposal(user, proposal) && (
              <Button variant="secondary" onClick={() => setShowCancelModal(true)} disabled={cancel.isPending}>
                Cancelar requerimiento
              </Button>
            )}
          </div>
        }
      />

      {editing && (
        <Card className="mb-6 border-brand-200">
          <CardHeader>Editar requerimiento</CardHeader>
          <CardBody className="space-y-3">
            <Input
              label="Título"
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
            />
            <TextArea
              label="Descripción"
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              rows={4}
            />
            {extraFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                value={editDatosExtra[field.key] ?? ""}
                onChange={(e) =>
                  setEditDatosExtra((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            ))}
            <Input
              label="Motivo del cambio (queda en el historial)"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Ej: el funcionario solicitado no está disponible"
            />
            <div className="flex gap-2">
              <Button disabled={saveEdit.isPending} onClick={() => saveEdit.mutate()}>
                Guardar cambios
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
            {saveEdit.error && (
              <p className="text-sm text-red-600">
                {saveEdit.error instanceof Error ? saveEdit.error.message : "Error"}
              </p>
            )}
          </CardBody>
        </Card>
      )}
      <div className="flex flex-wrap gap-2 mb-6">
        <StatusBadge kind="proposal" value={proposal.estado as ProposalStatus} />
        <Badge className={categoryColors[proposal.categoria as ProposalCategory]}>
          {categoryLabels[proposal.categoria as ProposalCategory]}
        </Badge>
        <StatusBadge kind="impact" value={proposal.impacto} />
        {proposal.createdBy && (
          <span className="text-sm text-slate-500 self-center">Por {proposal.createdBy.name}</span>
        )}
        {proposal.validatedBy && (
          <span className="text-sm text-slate-500 self-center">· Validado por {proposal.validatedBy.name}</span>
        )}
      </div>

      {proposal.estado === "REJECTED" && proposal.decisionReason && (
        <Card className="border-red-200 bg-red-50/50 mb-6">
          <CardHeader>Motivo del rechazo</CardHeader>
          <CardBody>
            <p className="text-red-800">{proposal.decisionReason}</p>
            {proposal.validatedBy && (
              <p className="text-red-600 text-xs mt-2">Por {proposal.validatedBy.name}</p>
            )}
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>Descripción</CardHeader>
        <CardBody>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{proposal.descripcion}</p>
        </CardBody>
      </Card>

      {proposal.datosExtra && (() => {
        let extra: Record<string, string>;
        try {
          extra = typeof proposal.datosExtra === "string"
            ? (JSON.parse(proposal.datosExtra) as Record<string, string>)
            : proposal.datosExtra;
        } catch {
          return null;
        }
        const fields = categoryExtraFields[proposal.categoria as ProposalCategory] ?? [];
        const entries = Object.entries(extra).filter(([, v]) => v != null && v !== "");
        if (entries.length === 0) return null;
        return (
          <Card className="mb-6">
            <CardHeader>Datos adicionales</CardHeader>
            <CardBody>
              <dl className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {entries.map(([key, value]) => {
                  const field = fields.find((f) => f.key === key);
                  return (
                    <div key={key} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {field?.label ?? key}
                      </dt>
                      <dd className="text-slate-800 mt-1">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            </CardBody>
          </Card>
        );
      })()}

      <Card className="mb-6">
        <CardHeader subtitle="Conversación sobre este requerimiento">Comentarios</CardHeader>
        <CardBody>
          <div className="space-y-4 max-h-80 overflow-y-auto mb-5">
            {(proposal.comments || []).length === 0 ? (
              <p className="text-sm text-slate-500 italic">Sin comentarios todavía.</p>
            ) : (
              (proposal.comments || []).map((c) => {
                const name = (c as { user?: { name: string } }).user?.name ?? "Usuario";
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials(name)}
                    </div>
                    <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 text-sm">{name}</span>
                        <span className="text-slate-400 text-xs">{formatDateShort(c.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 text-sm">{c.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim()) postComment.mutate();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <TextArea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribir comentario…"
              rows={2}
              className="flex-1"
            />
            <Button type="submit" disabled={postComment.isPending || !commentText.trim()} className="self-end">
              Comentar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader subtitle="Registro de cambios de estado">Historial de auditoría</CardHeader>
        <CardBody>
          <AuditTimeline audits={proposal.audits || []} />
        </CardBody>
      </Card>

      <Modal
        title="Rechazar requerimiento"
        subtitle="El motivo es obligatorio y quedará registrado"
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
      >
        <div className="space-y-4">
          <TextArea
            label="Motivo del rechazo (obligatorio)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indicá el motivo del rechazo…"
            rows={4}
            required
          />
          <div className="stack-actions sm:justify-end [&_button]:w-full [&_button]:sm:w-auto">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => reject.mutate()}
              disabled={reject.isPending || !rejectReason.trim()}
            >
              Confirmar rechazo
            </Button>
          </div>
        </div>
      </Modal>

      <Modal title="Cancelar requerimiento" open={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <div className="space-y-4">
          <p className="text-slate-600">¿Estás seguro de que querés cancelar este requerimiento?</p>
          <div className="stack-actions sm:justify-end [&_button]:w-full [&_button]:sm:w-auto">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              No
            </Button>
            <Button variant="danger" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              Sí, cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
