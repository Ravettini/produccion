import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import {
  getAreaDecisions,
  patchEventFields,
  submitAreaDecision,
  type EventAreaDecision,
} from "../../api/eventDecisions";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";
import { TextArea } from "../ui/TextArea";
import { SearchableSelect } from "../ui/SearchableSelect";
import { canSpecialtyEditEventFields } from "../../hooks/usePermissions";
import { PRODUCTORES_OPTIONS } from "../../config/productores";
import type { User } from "../../types";

interface AreaDecisionsPanelProps {
  eventId: string;
  user: User | null;
  funcionario?: string | null;
  productor?: string | null;
  tieneProduccion?: boolean;
}

export function AreaDecisionsPanel({
  eventId,
  user,
  funcionario,
  productor,
  tieneProduccion = false,
}: AreaDecisionsPanelProps) {
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [adminRejectRole, setAdminRejectRole] = useState<string | null>(null);
  const [funcionarioDraft, setFuncionarioDraft] = useState(funcionario ?? "");
  const [productorDraft, setProductorDraft] = useState(productor ?? "");
  const [editReason, setEditReason] = useState("");
  const [editingFunc, setEditingFunc] = useState(false);
  const [editingProd, setEditingProd] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const canSetProductor =
    tieneProduccion && (user?.role === "PRODUCCION" || user?.role === "ADMIN");

  const { data, isLoading } = useQuery({
    queryKey: ["area-decisions", eventId],
    queryFn: () => getAreaDecisions(eventId),
  });

  const decide = useMutation({
    mutationFn: (payload: {
      decision: "APPROVED" | "REJECTED";
      reason?: string;
      areaRole?: string;
    }) => submitAreaDecision(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["area-decisions", eventId] });
      qc.invalidateQueries({ queryKey: ["event-audits", eventId] });
      setRejecting(false);
      setRejectReason("");
      setAdminRejectRole(null);
    },
  });

  const saveFunc = useMutation({
    mutationFn: () =>
      patchEventFields(
        eventId,
        { funcionario: funcionarioDraft.trim() || null },
        editReason.trim() || undefined
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["event-audits", eventId] });
      setEditingFunc(false);
      setEditReason("");
    },
  });

  const saveProductor = useMutation({
    mutationFn: () =>
      patchEventFields(
        eventId,
        { productor: productorDraft.trim() || null },
        editReason.trim() || "Asignó referente de Producción"
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["event-audits", eventId] });
      setEditingProd(false);
      setEditReason("");
    },
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardBody className="py-4 text-sm text-slate-500">Cargando checks de áreas…</CardBody>
      </Card>
    );
  }

  if (data.requested.length === 0 && !canSetProductor) {
    return null;
  }

  const canEditFields = canSpecialtyEditEventFields(user, data.canDecide);
  const myDecision = data.decisions.find((d) => d.areaRole === data.myAreaRole);

  return (
    <div className="space-y-4">
      {data.requested.length > 0 && (
      <Card>
        <CardHeader>Aprobación por áreas solicitadas</CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-500">
            Cada área pedida en el evento debe marcar su conformidad (check) o rechazar con motivo.
            {isAdmin ? " Como admin podés poner el check en cualquier área." : ""}
          </p>
          <ul className="space-y-3">
            {data.decisions.map((d: EventAreaDecision) => {
              const estadoLabel =
                d.estado === "APPROVED"
                  ? "Aprobado"
                  : d.estado === "REJECTED"
                    ? "Rechazado"
                    : "Pendiente";
              const color =
                d.estado === "APPROVED"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : d.estado === "REJECTED"
                    ? "bg-red-50 text-red-800 ring-red-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200";
              return (
                <li
                  key={d.areaRole}
                  className="rounded-xl border border-slate-200 px-4 py-3 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{d.label ?? d.areaRole}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.user?.name
                          ? `${estadoLabel} por ${d.user.name}`
                          : estadoLabel}
                        {d.reason ? ` · ${d.reason}` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ring-1 ${color} self-start`}>
                      {d.estado === "APPROVED" ? "✓ " : d.estado === "REJECTED" ? "✕ " : "○ "}
                      {estadoLabel}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                      {adminRejectRole === d.areaRole ? (
                        <div className="w-full space-y-2">
                          <TextArea
                            label={`Motivo rechazo · ${d.label ?? d.areaRole}`}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={decide.isPending || !rejectReason.trim()}
                              onClick={() =>
                                decide.mutate({
                                  decision: "REJECTED",
                                  reason: rejectReason.trim(),
                                  areaRole: d.areaRole,
                                })
                              }
                            >
                              Confirmar rechazo
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setAdminRejectRole(null);
                                setRejectReason("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            disabled={decide.isPending}
                            onClick={() =>
                              decide.mutate({ decision: "APPROVED", areaRole: d.areaRole })
                            }
                          >
                            <Check className="w-4 h-4" aria-hidden />
                            Check admin
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={decide.isPending}
                            onClick={() => setAdminRejectRole(d.areaRole)}
                          >
                            <X className="w-4 h-4" aria-hidden />
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {data.canDecide && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Tu área: {myDecision?.label ?? data.myAreaRole}
              </p>
              {!rejecting ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ decision: "APPROVED" })}
                  >
                    <Check className="w-4 h-4" aria-hidden />
                    Aprobar / check
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={decide.isPending}
                    onClick={() => setRejecting(true)}
                  >
                    <X className="w-4 h-4" aria-hidden />
                    Rechazar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <TextArea
                    label="Motivo del rechazo"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={decide.isPending || !rejectReason.trim()}
                      onClick={() =>
                        decide.mutate({ decision: "REJECTED", reason: rejectReason.trim() })
                      }
                    >
                      Confirmar rechazo
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setRejecting(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              {decide.error && (
                <p className="text-sm text-red-600">
                  {decide.error instanceof Error ? decide.error.message : "Error"}
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
      )}

      {canSetProductor && (
        <Card>
          <CardHeader>Referente de Producción</CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-500">
              Solo el rol Producción define el referente de este evento.
            </p>
            {!editingProd ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Referente</p>
                  <p className="text-slate-800">{productor || "— Sin asignar —"}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setProductorDraft(productor ?? "");
                    setEditingProd(true);
                  }}
                >
                  {productor ? "Cambiar" : "Asignar"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <SearchableSelect
                  label="Referente de Producción"
                  placeholder="Seleccionar…"
                  searchPlaceholder="Buscar…"
                  options={[
                    { value: "", label: "— Sin referente —" },
                    ...PRODUCTORES_OPTIONS,
                  ]}
                  value={productorDraft}
                  onChange={setProductorDraft}
                  emptyMessage="Ningún referente coincide"
                />
                <Input
                  label="Motivo (opcional)"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={saveProductor.isPending}
                    onClick={() => saveProductor.mutate()}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingProd(false)}>
                    Cancelar
                  </Button>
                </div>
                {saveProductor.error && (
                  <p className="text-sm text-red-600">
                    {saveProductor.error instanceof Error
                      ? saveProductor.error.message
                      : "Error"}
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {canEditFields && (
        <Card>
          <CardHeader>Corregir datos del evento</CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-500">
              Si un dato no aplica (ej. un funcionario no disponible), cambialo acá. Queda registrado quién y qué editó.
            </p>
            {!editingFunc ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Funcionario(s)</p>
                  <p className="text-slate-800">{funcionario || "— Sin indicar —"}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFuncionarioDraft(funcionario ?? "");
                    setEditingFunc(true);
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  label="Funcionario(s)"
                  value={funcionarioDraft}
                  onChange={(e) => setFuncionarioDraft(e.target.value)}
                  placeholder="Nombre(s) de reemplazo"
                />
                <Input
                  label="Motivo del cambio (opcional)"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ej: el funcionario solicitado no está disponible"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={saveFunc.isPending}
                    onClick={() => saveFunc.mutate()}
                  >
                    Guardar cambio
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingFunc(false)}>
                    Cancelar
                  </Button>
                </div>
                {saveFunc.error && (
                  <p className="text-sm text-red-600">
                    {saveFunc.error instanceof Error ? saveFunc.error.message : "Error"}
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
