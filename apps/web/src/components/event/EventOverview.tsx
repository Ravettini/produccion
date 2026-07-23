import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileDown, Sparkles } from "lucide-react";
import type { Event, User } from "../../types";
import { Button, Card, CardBody, CardHeader, TextArea } from "../ui";
import { SearchableSelect } from "../ui/SearchableSelect";
import { patchEventFields } from "../../api/eventDecisions";
import { PRODUCTORES_OPTIONS } from "../../config/productores";

interface EventOverviewProps {
  event: Event;
  user?: User | null;
  editingResumen: boolean;
  resumenDraft: string;
  onStartEditResumen: () => void;
  onResumenChange: (value: string) => void;
  onSaveResumen: () => void;
  onCancelEditResumen: () => void;
  savingResumen: boolean;
  resumenError?: string;
  onGenerateBrief: () => void;
  generatingBrief: boolean;
  briefError?: string;
  onExportAc: () => void;
  exportingAc: boolean;
  canSyncAcreditapp?: boolean;
  onSyncAcreditapp?: () => void;
  syncingAcreditapp?: boolean;
  acreditappWarning?: string;
  acreditappSyncError?: string;
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </h3>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}

export function EventOverview({
  event,
  user,
  editingResumen,
  resumenDraft,
  onStartEditResumen,
  onResumenChange,
  onSaveResumen,
  onCancelEditResumen,
  savingResumen,
  resumenError,
  onGenerateBrief,
  generatingBrief,
  briefError,
  onExportAc,
  exportingAc,
  canSyncAcreditapp,
  onSyncAcreditapp,
  syncingAcreditapp,
  acreditappWarning,
  acreditappSyncError,
}: EventOverviewProps) {
  const qc = useQueryClient();
  const [editingProductor, setEditingProductor] = useState(false);
  const [productorDraft, setProductorDraft] = useState(event.productor ?? "");

  const tieneProduccion = /producci[oó]n/i.test(event.tipoEvento);
  const canEditProductor =
    tieneProduccion && (user?.role === "PRODUCCION" || user?.role === "ADMIN");

  const saveProductor = useMutation({
    mutationFn: () =>
      patchEventFields(
        event.id,
        { productor: productorDraft.trim() || null },
        "Asignó referente de Producción"
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", event.id] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event-audits", event.id] });
      qc.invalidateQueries({ queryKey: ["proposals", event.id] });
      setEditingProductor(false);
    },
  });

  const publicoLabel =
    event.publico === "EXTERNO"
      ? "Externo"
      : event.publico === "INTERNO"
        ? "Interno"
        : event.publico === "MIXTO"
          ? "Mixto"
          : null;

  const needsAcreditappSync =
    event.necesitaAcreditacion === true && !event.linkAcreditacionConvocados?.trim();

  let dp: Record<string, string> = {};
  try {
    const raw = event.datosProduccion;
    if (raw && typeof raw === "string") dp = JSON.parse(raw) as Record<string, string>;
    else if (raw && typeof raw === "object") dp = raw as Record<string, string>;
  } catch {
    dp = {};
  }

  return (
    <section className="mb-8 space-y-4" aria-labelledby="brief-evento">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="brief-evento" className="text-xl font-semibold text-slate-900">
            Brief y sinopsis
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Generá la sinopsis con IA o descargá el brief reducido AC.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={onGenerateBrief}
            disabled={generatingBrief}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {generatingBrief ? "Generando…" : "Generar con IA"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onExportAc}
            disabled={exportingAc}
          >
            <FileDown className="h-4 w-4" aria-hidden />
            {exportingAc ? "Exportando…" : "Brief reducido AC"}
          </Button>
        </div>
      </div>

      {(briefError || resumenError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {briefError || resumenError}
        </div>
      )}

      {(acreditappWarning || acreditappSyncError) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {acreditappSyncError ||
            acreditappWarning ||
            "El evento se guardó, pero no se pudo crear en Acreditapp. Revisá la configuración o reintentá."}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card>
          <CardHeader subtitle="Datos consolidados del evento">Brief del evento</CardHeader>
          <CardBody>
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Descripción</h3>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-800">
                  {event.descripcion}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Requiere">{event.tipoEvento}</Detail>
                <Detail label="Área solicitante">{event.areaSolicitante}</Detail>
                {event.usuarioSolicitante && (
                  <Detail label="Referente del área solicitante">{event.usuarioSolicitante}</Detail>
                )}
                {publicoLabel && <Detail label="Público">{publicoLabel}</Detail>}
                {event.programa && <Detail label="Programa">{event.programa}</Detail>}
                {event.funcionario && (
                  <Detail label="Funcionario(s)">{event.funcionario}</Detail>
                )}
                {event.necesitaAcreditacion != null && (
                  <Detail label="Acreditación">
                    {event.necesitaAcreditacion ? "Sí" : "No"}
                  </Detail>
                )}
                {event.necesitaAcreditacion === true && (
                  <>
                    <Detail label="Mesas">
                      {dp.acreditacionMesas === "si"
                        ? `Sí${dp.acreditacionMesaCount ? ` (${dp.acreditacionMesaCount})` : ""}`
                        : dp.acreditacionMesas === "no"
                          ? "No"
                          : "—"}
                    </Detail>
                    <Detail label="Notas">
                      {dp.acreditacionNotas === "si"
                        ? "Sí"
                        : dp.acreditacionNotas === "no"
                          ? "No"
                          : "—"}
                    </Detail>
                    <Detail label="Google Sheets">
                      {dp.acreditacionSheets === "si"
                        ? "Sí"
                        : dp.acreditacionSheets === "no"
                          ? "No"
                          : "—"}
                    </Detail>
                  </>
                )}
                {event.linkAcreditacionConvocados && (
                  <Detail label="Link de acreditación">
                    <a
                      href={event.linkAcreditacionConvocados}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-gov-600 hover:underline"
                    >
                      {event.linkAcreditacionConvocados}
                    </a>
                  </Detail>
                )}
              </div>

              {tieneProduccion && (
                <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                        Referente de Producción
                      </p>
                      {!editingProductor && (
                        <p className="mt-1 text-sm text-slate-800">
                          {event.productor?.trim() || "— Sin asignar —"}
                        </p>
                      )}
                    </div>
                    {canEditProductor && !editingProductor && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setProductorDraft(event.productor ?? "");
                          setEditingProductor(true);
                        }}
                      >
                        {event.productor ? "Cambiar" : "Asignar"}
                      </Button>
                    )}
                  </div>
                  {editingProductor && canEditProductor && (
                    <div className="space-y-3">
                      <SearchableSelect
                        label="Referente"
                        value={productorDraft}
                        onChange={setProductorDraft}
                        options={[
                          { value: "", label: "— Sin referente —" },
                          ...PRODUCTORES_OPTIONS,
                        ]}
                        placeholder="Buscar referente…"
                        emptyMessage="Ningún referente coincide"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() => saveProductor.mutate()}
                          disabled={saveProductor.isPending}
                        >
                          {saveProductor.isPending ? "Guardando…" : "Guardar"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditingProductor(false);
                            setProductorDraft(event.productor ?? "");
                          }}
                          disabled={saveProductor.isPending}
                        >
                          Cancelar
                        </Button>
                      </div>
                      {saveProductor.isError && (
                        <p className="text-sm text-red-600">
                          {(saveProductor.error as Error).message ||
                            "No se pudo guardar el referente."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {needsAcreditappSync && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 space-y-3">
                  <p className="text-sm text-amber-900">
                    Este evento necesita acreditación pero todavía no tiene link en Acreditapp.
                  </p>
                  {canSyncAcreditapp && onSyncAcreditapp && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onSyncAcreditapp}
                      disabled={syncingAcreditapp}
                    >
                      {syncingAcreditapp
                        ? "Sincronizando…"
                        : "Crear / sincronizar en Acreditapp"}
                    </Button>
                  )}
                </div>
              )}

              {event.estado === "CANCELADO" && event.motivoCancelacion && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="text-sm font-medium text-red-800">
                    Motivo de cancelación
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-red-900">
                    {event.motivoCancelacion}
                  </p>
                </div>
              )}

              {event.estado === "REALIZADO" &&
                (event.realizacionAsistentes != null ||
                  event.realizacionImpacto ||
                  event.realizacionLinkImpacto) && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="text-sm font-medium text-blue-800">
                      Resultado del evento
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-blue-900">
                      {event.realizacionAsistentes != null && (
                        <p>
                          <strong>Asistentes:</strong> {event.realizacionAsistentes}
                        </p>
                      )}
                      {event.realizacionImpacto && (
                        <p className="whitespace-pre-wrap">
                          <strong>Impacto:</strong> {event.realizacionImpacto}
                        </p>
                      )}
                      {event.realizacionLinkImpacto && (
                        <p>
                          <strong>Recurso:</strong>{" "}
                          <a
                            href={event.realizacionLinkImpacto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {event.realizacionLinkImpacto}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            subtitle="Va como «Sinopsis del proyecto» en el DOCX"
            action={
              !editingResumen ? (
                <Button size="sm" variant="ghost" onClick={onStartEditResumen}>
                  {event.resumen ? "Editar" : "Agregar"}
                </Button>
              ) : undefined
            }
          >
            Sinopsis
          </CardHeader>
          <CardBody>
            {editingResumen ? (
              <div className="space-y-3">
                <TextArea
                  value={resumenDraft}
                  onChange={(e) => onResumenChange(e.target.value)}
                  rows={10}
                  placeholder="Sinopsis del proyecto…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={onSaveResumen} disabled={savingResumen}>
                    {savingResumen ? "Guardando…" : "Guardar sinopsis"}
                  </Button>
                  <Button variant="secondary" onClick={onCancelEditResumen}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : event.resumen ? (
              <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
                {event.resumen}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                <p className="text-sm text-slate-500">
                  Todavía no hay sinopsis. Tocá «Generar con IA» para armarla y descargar el brief.
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="secondary"
                  onClick={onStartEditResumen}
                >
                  Escribir sinopsis
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
