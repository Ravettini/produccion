import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProposal,
  submitProposal,
  approveProposal,
  rejectProposal,
  cancelProposal,
  addComment,
} from "../api/proposals";
import { useAuth } from "../hooks/useAuth";
import {
  canApproveOrRejectProposal,
  canSubmitProposal,
  canCancelProposal,
} from "../hooks/usePermissions";
import type { ProposalStatus, ProposalCategory } from "../types";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Modal,
  Input,
  TextArea,
  DetailSkeleton,
} from "../components/ui";
import {
  proposalStatusLabels,
  proposalStatusColors,
  categoryLabels,
} from "../utils/labels";
import { categoryExtraFields } from "../config/proposalCategoryFields";

const impactLabels: Record<string, string> = {
  ALTO: "Alto",
  MEDIO: "Medio",
  BAJO: "Bajo",
};

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => getProposal(id!),
    enabled: !!id,
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

  if (isLoading || !proposal) {
    return <DetailSkeleton />;
  }

  const eventId = proposal.eventId || (proposal.event as { id: string })?.id;
  const eventTitulo = (proposal.event as { titulo?: string })?.titulo ?? "Evento";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={eventId ? `/events/${eventId}` : "/"}
          className="text-slate-600 hover:text-slate-800 text-sm mb-2 inline-block"
        >
          ← {eventTitulo}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-800">{proposal.titulo}</h1>
        {proposal.nombreProyecto && (
          <p className="text-slate-600 mt-1">Proyecto: {proposal.nombreProyecto}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <Badge className={proposalStatusColors[proposal.estado as ProposalStatus]}>
            {proposalStatusLabels[proposal.estado as ProposalStatus]}
          </Badge>
          <span className="text-slate-500 text-sm">{categoryLabels[proposal.categoria as ProposalCategory]}</span>
          <span className="text-slate-500 text-sm">Impacto: {impactLabels[proposal.impacto] ?? proposal.impacto}</span>
          {proposal.createdBy && (
            <span className="text-slate-500 text-sm">Por {proposal.createdBy.name}</span>
          )}
          {proposal.validatedBy && (
            <span className="text-slate-500 text-sm">· Aprobado por {proposal.validatedBy.name}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {proposal.estado === "DRAFT" && canSubmitProposal(user, proposal) && (
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            Enviar a validación
          </Button>
        )}
        {proposal.estado === "SUBMITTED" && canApproveOrRejectProposal(user) && (
          <>
            <Button
              onClick={() => approve.mutate()}
              disabled={approve.isPending}
              className="!bg-emerald-600 hover:!bg-emerald-700"
            >
              Aprobar
            </Button>
            <Button variant="danger" onClick={() => setShowRejectModal(true)}>
              Rechazar
            </Button>
          </>
        )}
        {canCancelProposal(user, proposal) && (
          <Button variant="secondary" onClick={() => setShowCancelModal(true)} disabled={cancel.isPending}>
            Cancelar propuesta
          </Button>
        )}
      </div>

      {proposal.estado === "REJECTED" && proposal.decisionReason && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>Motivo del rechazo</CardHeader>
          <CardBody>
            <p className="text-red-700">{proposal.decisionReason}</p>
            {proposal.validatedBy && (
              <p className="text-red-600 text-xs mt-2">Por {proposal.validatedBy.name}</p>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>Descripción</CardHeader>
        <CardBody>
          <p className="text-slate-800 whitespace-pre-wrap">{proposal.descripcion}</p>
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
          <Card>
            <CardHeader>Datos adicionales</CardHeader>
            <CardBody>
              <dl className="space-y-2">
                {entries.map(([key, value]) => {
                  const field = fields.find((f) => f.key === key);
                  return (
                    <div key={key}>
                      <dt className="text-sm font-medium text-slate-500">{field?.label ?? key}</dt>
                      <dd className="text-slate-800 mt-0.5">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            </CardBody>
          </Card>
        );
      })()}

      <Card>
        <CardHeader>Comentarios</CardHeader>
        <CardBody>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {(proposal.comments || []).map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <span className="font-medium text-slate-700 shrink-0">
                  {(c as { user?: { name: string } }).user?.name ?? "—"}:
                </span>
                <span className="text-slate-600">{c.body}</span>
                <span className="text-slate-400 text-xs shrink-0">
                  {new Date(c.createdAt).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim()) postComment.mutate();
            }}
            className="flex gap-2"
          >
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribir comentario…"
              className="flex-1"
            />
            <Button type="submit" disabled={postComment.isPending || !commentText.trim()}>
              Comentar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Historial</CardHeader>
        <CardBody>
          <ul className="space-y-3">
            {(proposal.audits || []).map((a) => (
              <li key={a.id} className="flex gap-3 text-sm border-l-2 border-slate-200 pl-4 py-1">
                <div className="shrink-0 text-slate-500 text-xs w-32">
                  {new Date(a.createdAt).toLocaleString("es-AR")}
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    {(a as { user?: { name: string } }).user?.name ?? "—"}
                  </span>
                  <span className="text-slate-600"> — {a.action}</span>
                  {a.fromStatus && a.toStatus && (
                    <span className="text-slate-500">
                      {" "}({a.fromStatus} → {a.toStatus})
                    </span>
                  )}
                  {a.reason && <p className="text-slate-600 mt-1 italic">{a.reason}</p>}
                </div>
              </li>
            ))}
          </ul>
          {!proposal.audits?.length && (
            <p className="text-slate-500 text-sm">Sin registros aún.</p>
          )}
        </CardBody>
      </Card>

      <Modal
        title="Rechazar propuesta"
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
      >
        <div className="space-y-4">
          <TextArea
            label="Motivo del rechazo (obligatorio)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indicá el motivo del rechazo..."
            rows={3}
            required
          />
          <div className="flex gap-2 justify-end">
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

      <Modal
        title="Cancelar propuesta"
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      >
        <div className="space-y-4">
          <p className="text-slate-600">¿Estás seguro de que querés cancelar esta propuesta?</p>
          <div className="flex gap-2 justify-end">
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
