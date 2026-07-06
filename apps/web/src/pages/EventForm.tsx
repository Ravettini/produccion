import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvent, createEvent, updateEvent } from "../api/events";
import { uploadAttachment } from "../api/attachments";
import type { EventStatus } from "../types";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";
import { Select } from "../components/ui/Select";
import { CheckboxGroup } from "../components/ui/CheckboxGroup";
import { Modal } from "../components/ui/Modal";
import { Card, CardBody } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { eventStatusLabels } from "../utils/labels";
import { categoryExtraFields, cateringFields, coberturaBriefFields } from "../config/proposalCategoryFields";
import { DIRECCIONES_GENERALES_OPTIONS } from "../config/direccionesGenerales";
import { getLugaresParaCantidad } from "../config/lugaresPorCapacidad";
import { canEditEvent } from "../hooks/usePermissions";
import { getProgramasParaArea } from "../config/programasPorArea";
import { FUNCIONARIOS_OPTIONS } from "../config/funcionarios";

const PRODUCCION_FORM_EXCLUDE = new Set(["horarioCitacion", "cantidadPersonas", "lugar"]);

const statusOptions = (Object.entries(eventStatusLabels) as [EventStatus, string][]).map(
  ([value, label]) => ({ value, label })
);

const TIPO_OPCIONES = [
  { value: "Otro", label: "Otro", title: "Otro tipo de evento (especificar en el campo siguiente)." },
  { value: "Producción", label: "Producción", title: "Incluye técnica (pantallas, sonido), catering, materiales y piezas de comunicación." },
  { value: "Institucionales", label: "Institucionales", title: "Eventos formales con autoridades, protocolo y funcionarios." },
  { value: "Cobertura", label: "Cobertura", title: "Registro audiovisual, fotográfico o de prensa del evento." },
];

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const isDirectorGeneral = user?.role === "DIRECTOR_GENERAL";
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>([]);
  const [tipoOtro, setTipoOtro] = useState("");
  const [areaSolicitante, setAreaSolicitante] = useState("");
  const [fechaTentativa, setFechaTentativa] = useState("");
  const [estado, setEstado] = useState<EventStatus>("PENDIENTE");
  const [resumen, setResumen] = useState("");
  const [publico, setPublico] = useState<"EXTERNO" | "INTERNO" | "MIXTO" | "">("");
  const [usuarioSolicitante, setUsuarioSolicitante] = useState("");
  const [lugar, setLugar] = useState("");
  const [programa, setPrograma] = useState("");
  const [funcionario, setFuncionario] = useState("");
  const [necesitaAcreditacion, setNecesitaAcreditacion] = useState<boolean | "">("");
  const [linkAcreditacionConvocados, setLinkAcreditacionConvocados] = useState("");
  const [datosProduccion, setDatosProduccion] = useState<Record<string, string>>({});
  const [realizacionAsistentes, setRealizacionAsistentes] = useState<string>("");
  const [realizacionImpacto, setRealizacionImpacto] = useState("");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ action: "CONFIRMADO" | "CANCELADO" } | null>(null);
  const [tipoError, setTipoError] = useState("");
  const [archivosPdf, setArchivosPdf] = useState<File[]>([]);

  const { data: existing } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (user?.area && isNew && !existing) {
      setAreaSolicitante(user.area);
    }
  }, [user?.area, isNew, existing]);

  useEffect(() => {
    if (existing) {
      setTitulo(existing.titulo);
      setDescripcion(existing.descripcion);
      const partes = existing.tipoEvento.split(",").map((s) => s.trim()).filter(Boolean);
      const conocidos = partes.filter((p) =>
        TIPO_OPCIONES.some((o) => o.value === p) || p === "Comunicación"
      ).map((p) => (p === "Comunicación" ? "Cobertura" : p));
      const otros = partes.filter((p) => !TIPO_OPCIONES.some((o) => o.value === p) && p !== "Comunicación");
      setTipoSeleccionados(conocidos);
      setTipoOtro(otros.join(", "));
      setAreaSolicitante(existing.areaSolicitante);
      setFechaTentativa(existing.fechaTentativa.slice(0, 10));
      setEstado(existing.estado as EventStatus);
      setResumen(existing.resumen ?? "");
      setPublico((existing.publico as "EXTERNO" | "INTERNO" | "MIXTO") ?? "");
      setUsuarioSolicitante(existing.usuarioSolicitante ?? "");
      setLugar(existing.lugar ?? "");
      setPrograma(existing.programa ?? "");
      setFuncionario((existing as { funcionario?: string | null }).funcionario ?? "");
      setNecesitaAcreditacion((existing as { necesitaAcreditacion?: boolean | null }).necesitaAcreditacion ?? "");
      setLinkAcreditacionConvocados((existing as { linkAcreditacionConvocados?: string | null }).linkAcreditacionConvocados ?? "");
      const dp = existing.datosProduccion;
      if (dp != null) {
        const parsed = typeof dp === "string" ? (() => { try { return JSON.parse(dp); } catch { return {}; } })() : dp;
        setDatosProduccion(parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {});
      }
      setRealizacionAsistentes((existing as { realizacionAsistentes?: number | null }).realizacionAsistentes != null ? String((existing as { realizacionAsistentes: number }).realizacionAsistentes) : "");
      setRealizacionImpacto((existing as { realizacionImpacto?: string | null }).realizacionImpacto ?? "");
      setMotivoCancelacion((existing as { motivoCancelacion?: string | null }).motivoCancelacion ?? "");
    }
  }, [existing]);

  const create = useMutation({
    mutationFn: async (data: Parameters<typeof createEvent>[0] & { files?: File[] }) => {
      const { files = [], ...eventData } = data;
      const event = await createEvent(eventData);
      for (const file of files) {
        await uploadAttachment(event.id, file);
      }
      return event;
    },
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["attachments", event.id] });
      navigate(`/events/${event.id}`);
    },
  });
  const update = useMutation({
    mutationFn: async ({
      id: i,
      data,
      files = [],
    }: {
      id: string;
      data: Parameters<typeof updateEvent>[1];
      files?: File[];
    }) => {
      await updateEvent(i, data);
      for (const file of files) {
        await uploadAttachment(i, file);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event", id] });
      qc.invalidateQueries({ queryKey: ["attachments", id] });
      navigate(`/events/${id}`);
    },
  });

  const handleEstadoChange = (newEstado: EventStatus) => {
    if (newEstado === "CONFIRMADO" && !isAdmin) {
      return; // Solo ADMIN puede confirmar
    }
    if ((newEstado === "CONFIRMADO" || newEstado === "CANCELADO") && !isNew) {
      setConfirmModal({ action: newEstado });
    } else {
      setEstado(newEstado);
    }
  };

  const confirmEstadoChange = () => {
    if (confirmModal) {
      setEstado(confirmModal.action);
      setConfirmModal(null);
    }
  };

  const tipoEventoValue = [...tipoSeleccionados, tipoOtro.trim()].filter(Boolean).join(", ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTipoError("");
    if (tipoEventoValue.length === 0) {
      setTipoError("Seleccioná al menos una opción o completá «Otro»");
      return;
    }
    if (!isNew && estado === "CANCELADO" && !motivoCancelacion.trim()) {
      setTipoError("Al cancelar el evento es obligatorio indicar el motivo o razón.");
      return;
    }
    if (isAdmin && !areaSolicitante.trim()) {
      setTipoError("Seleccioná una dirección general solicitante.");
      return;
    }
    if (isNew) {
      create.mutate({
        titulo,
        descripcion,
        tipoEvento: tipoEventoValue,
        areaSolicitante,
        fechaTentativa: fechaTentativa || new Date().toISOString().slice(0, 10),
        estado: isAdmin ? estado : "PENDIENTE",
        resumen: resumen.trim() || undefined,
        publico: publico || undefined,
        usuarioSolicitante: usuarioSolicitante.trim() || undefined,
        lugar: lugar.trim() || undefined,
        programa: programa.trim() || undefined,
        funcionario: funcionario.trim() || undefined,
        necesitaAcreditacion: necesitaAcreditacion === true || necesitaAcreditacion === false ? necesitaAcreditacion : undefined,
        linkAcreditacionConvocados: linkAcreditacionConvocados.trim() || undefined,
        datosProduccion: Object.keys(datosProduccion).length > 0 ? datosProduccion : undefined,
        files: archivosPdf,
      });
    } else {
      update.mutate({
        id: id!,
        data: {
          titulo,
          descripcion,
          tipoEvento: tipoEventoValue,
          areaSolicitante,
          fechaTentativa: fechaTentativa || existing!.fechaTentativa,
          estado: isDirectorGeneral ? existing!.estado : isAdmin ? estado : existing!.estado,
          resumen: resumen.trim() || null,
          publico: publico || null,
          usuarioSolicitante: usuarioSolicitante.trim() || null,
          lugar: lugar.trim() || null,
          programa: programa.trim() || null,
          funcionario: funcionario.trim() || null,
          necesitaAcreditacion: necesitaAcreditacion === true || necesitaAcreditacion === false ? necesitaAcreditacion : null,
          linkAcreditacionConvocados: linkAcreditacionConvocados.trim() || null,
          datosProduccion: Object.keys(datosProduccion).length > 0 ? datosProduccion : null,
          realizacionAsistentes: estado === "REALIZADO" && realizacionAsistentes.trim() ? parseInt(realizacionAsistentes, 10) : undefined,
          realizacionImpacto: estado === "REALIZADO" && realizacionImpacto.trim() ? realizacionImpacto.trim() : undefined,
          motivoCancelacion: estado === "CANCELADO" ? (motivoCancelacion.trim() || null) : undefined,
        },
        files: archivosPdf,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const pdfs = files.filter((f) => f.type === "application/pdf");
    setArchivosPdf((prev) => [...prev, ...pdfs]);
    e.target.value = "";
  };

  const removeArchivo = (index: number) => {
    setArchivosPdf((prev) => prev.filter((_, i) => i !== index));
  };

  const err = create.error || update.error;
  const isPending = create.isPending || update.isPending;

  if (!isNew && existing && !canEditEvent(user, existing)) {
    return (
      <div className="page-container max-w-3xl">
        <p className="text-slate-600">No tenés permiso para editar este evento.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(`/events/${id}`)}>
          Volver al evento
        </Button>
      </div>
    );
  }

  const cantidadPersonas = parseInt(datosProduccion.cantidadPersonas ?? "", 10);
  const lugaresOpciones = getLugaresParaCantidad(
    !Number.isNaN(cantidadPersonas) ? cantidadPersonas : 0
  );

  const estadoOptions = isAdmin
    ? statusOptions
    : statusOptions.filter((o) => o.value !== "CONFIRMADO");

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        title={isNew ? "Nuevo evento" : "Editar evento"}
        subtitle={isNew ? "Completá la información del brief institucional" : "Actualizá los datos del evento"}
        breadcrumb={
          <button
            type="button"
            onClick={() => navigate(isNew ? "/" : `/events/${id}`)}
            className="text-sm text-slate-500 hover:text-brand-600 transition-colors"
          >
            ← Volver
          </button>
        }
      />
      <Card>
        <CardBody className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Título / Nombre del evento"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Nombre del evento"
            />
            <Input
              label="Cantidad de personas (estimada)"
              type="number"
              min={1}
              value={datosProduccion.cantidadPersonas ?? ""}
              onChange={(e) =>
                setDatosProduccion((prev) => ({ ...prev, cantidadPersonas: e.target.value }))
              }
              placeholder="Ej: 80"
              hint="Define qué lugares están disponibles"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {user?.area && !isAdmin ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">DG solicitante</label>
                  <p className="text-slate-800 py-2.5 px-3.5 bg-slate-100 rounded-xl border border-slate-200">{user.area}</p>
                  <input type="hidden" name="areaSolicitante" value={user.area} />
                </div>
              ) : !user?.area && !isAdmin ? (
                <Select
                  label="DG solicitante"
                  options={[{ value: "", label: "Seleccionar DG…" }, ...DIRECCIONES_GENERALES_OPTIONS]}
                  value={areaSolicitante}
                  onChange={(e) => setAreaSolicitante(e.target.value)}
                  required
                />
              ) : (
                <Select
                  label="DG solicitante"
                  options={[
                    { value: "", label: "Seleccionar DG…" },
                    ...DIRECCIONES_GENERALES_OPTIONS,
                  ]}
                  value={areaSolicitante}
                  onChange={(e) => setAreaSolicitante(e.target.value)}
                />
              )}
              <Input
                label="Fecha"
                type="date"
                value={fechaTentativa}
                onChange={(e) => setFechaTentativa(e.target.value)}
                required
              />
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Horarios</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Convocatoria"
                  type="time"
                  value={datosProduccion.horarioConvocatoria ?? ""}
                  onChange={(e) =>
                    setDatosProduccion((prev) => ({ ...prev, horarioConvocatoria: e.target.value }))
                  }
                />
                <Input
                  label="Comienzo"
                  type="time"
                  value={datosProduccion.horarioComienzo ?? ""}
                  onChange={(e) =>
                    setDatosProduccion((prev) => ({ ...prev, horarioComienzo: e.target.value }))
                  }
                />
                <Input
                  label="Finalización"
                  type="time"
                  value={datosProduccion.horarioFinalizacion ?? ""}
                  onChange={(e) =>
                    setDatosProduccion((prev) => ({ ...prev, horarioFinalizacion: e.target.value }))
                  }
                />
              </div>
            </div>
            <Select
              label="Lugar"
              options={[
                { value: "", label: "Seleccionar lugar…" },
                ...lugaresOpciones.map((l) => ({ value: l.value, label: l.label })),
                ...(lugar && !lugaresOpciones.some((l) => l.value === lugar)
                  ? [{ value: lugar, label: lugar }]
                  : []),
              ]}
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
            />
            <div>
              <CheckboxGroup
                label="Requiere"
                options={TIPO_OPCIONES}
                value={tipoSeleccionados}
                onChange={(v) => { setTipoSeleccionados(v); setTipoError(""); }}
                required
              />
              {tipoError && (
                <p className="mt-1 text-sm text-red-600">{tipoError}</p>
              )}
            </div>
            <Input
              label="Otro (opcional)"
              value={tipoOtro}
              onChange={(e) => setTipoOtro(e.target.value)}
              placeholder="Ej: Jornada, Seminario..."
            />
            <TextArea
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              rows={4}
            />
            <Select
              label="Público"
              options={[
                { value: "", label: "Seleccionar…" },
                { value: "INTERNO", label: "Interno" },
                { value: "EXTERNO", label: "Externo" },
                { value: "MIXTO", label: "Mixto" },
              ]}
              value={publico}
              onChange={(e) => setPublico(e.target.value as "EXTERNO" | "INTERNO" | "MIXTO" | "")}
            />
            <Input
              label="Referente del evento (opcional)"
              value={usuarioSolicitante}
              onChange={(e) => setUsuarioSolicitante(e.target.value)}
              placeholder="Nombre de quien solicita o referente operativo"
            />
            {(() => {
              const areaParaProgramas = (user?.area && !isAdmin) ? user.area : areaSolicitante.trim();
              const opcionesPrograma = getProgramasParaArea(areaParaProgramas);
              if (opcionesPrograma.length > 0) {
                return (
                  <SearchableSelect
                    label="Programa (opcional)"
                    placeholder="Buscar o seleccionar programa…"
                    searchPlaceholder="Buscar programa…"
                    options={[{ value: "", label: "— Sin programa —" }, ...opcionesPrograma]}
                    value={programa}
                    onChange={(v) => setPrograma(v)}
                    emptyMessage="Ningún programa coincide con la búsqueda"
                  />
                );
              }
              return (
                <Input
                  label="Programa (opcional)"
                  value={programa}
                  onChange={(e) => setPrograma(e.target.value)}
                  placeholder="No hay programas definidos para esta área. Escribí el nombre si corresponde."
                />
              );
            })()}
            <SearchableSelect
              label="Funcionario(s) (opcional)"
              placeholder="Buscar funcionario…"
              searchPlaceholder="Buscar por nombre o apellido…"
              options={[{ value: "Otro", label: "Otro" }, { value: "", label: "— Sin funcionario —" }, ...FUNCIONARIOS_OPTIONS]}
              value={funcionario}
              onChange={(v) => setFuncionario(v)}
              emptyMessage="Ningún funcionario coincide con la búsqueda"
            />
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Acreditación</h3>
              <Select
                label="¿Se necesita acreditación?"
                options={[
                  { value: "", label: "Seleccionar…" },
                  { value: "true", label: "Sí" },
                  { value: "false", label: "No" },
                ]}
                value={necesitaAcreditacion === "" ? "" : necesitaAcreditacion ? "true" : "false"}
                onChange={(e) => setNecesitaAcreditacion(e.target.value === "" ? "" : e.target.value === "true")}
              />
              {necesitaAcreditacion === true && (
                <Input
                  label="Link a convocados para acreditar"
                  value={linkAcreditacionConvocados}
                  onChange={(e) => setLinkAcreditacionConvocados(e.target.value)}
                  placeholder="URL del formulario o listado de convocados"
                  className="mt-3"
                />
              )}
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Catering</h3>
              <p className="text-xs text-slate-500 mb-3">¿Se requiere catering? Si es sí, completá los datos.</p>
              <div className="space-y-3">
                {cateringFields.filter((f) => f.key === "catering").map((field) => (
                  <Select
                    key={field.key}
                    label={field.label}
                    options={field.options ?? []}
                    value={datosProduccion[field.key] ?? ""}
                    onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ))}
                {datosProduccion.catering === "si" &&
                  cateringFields.filter((f) => f.key !== "catering").map((field) => (
                    <div key={field.key}>
                      {field.type === "textarea" ? (
                        <TextArea
                          label={field.label}
                          placeholder={field.placeholder}
                          value={datosProduccion[field.key] ?? ""}
                          onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          rows={2}
                        />
                      ) : field.type === "select" && field.options?.length ? (
                        <Select
                          label={field.label}
                          options={field.options}
                          value={datosProduccion[field.key] ?? ""}
                          onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      ) : (
                        <Input
                          label={field.label}
                          placeholder={field.placeholder}
                          value={datosProduccion[field.key] ?? ""}
                          onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          type={field.type === "number" ? "number" : "text"}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
            {tipoSeleccionados.includes("Cobertura") && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Cobertura / Audiovisual</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Datos para el brief de piezas de comunicación y/o cobertura del evento.
                </p>
                <div className="space-y-3">
                  {coberturaBriefFields.map((field) => (
                    <div key={field.key}>
                      {field.type === "textarea" ? (
                        <TextArea
                          label={field.label}
                          placeholder={field.placeholder}
                          value={datosProduccion[field.key] ?? ""}
                          onChange={(e) =>
                            setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          rows={3}
                        />
                      ) : field.type === "select" && field.options?.length ? (
                        <Select
                          label={field.label}
                          options={field.options}
                          value={datosProduccion[field.key] ?? ""}
                          onChange={(e) =>
                            setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                        />
                      ) : (
                        <Input
                          label={field.label}
                          placeholder={field.placeholder}
                          value={datosProduccion[field.key] ?? ""}
                          onChange={(e) =>
                            setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Producción (opcional)</h3>
              <p className="text-xs text-slate-500 mb-3">Técnica y materiales. Se usan en el brief si no hay propuesta de Producción aprobada.</p>
              <div className="space-y-3">
                {categoryExtraFields.PRODUCCION.filter((f) => !PRODUCCION_FORM_EXCLUDE.has(f.key)).map((field) => (
                  <div key={field.key}>
                    {field.type === "textarea" ? (
                      <TextArea
                        label={field.label}
                        placeholder={field.placeholder}
                        value={datosProduccion[field.key] ?? ""}
                        onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        rows={2}
                      />
                    ) : field.type === "select" && field.options?.length ? (
                      <Select
                        label={field.label}
                        options={field.options}
                        value={datosProduccion[field.key] ?? ""}
                        onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        label={field.label}
                        placeholder={field.placeholder}
                        value={datosProduccion[field.key] ?? ""}
                        onChange={(e) => setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {estado === "CANCELADO" && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50/50">
                <h3 className="text-sm font-semibold text-red-800 mb-2">Motivo de cancelación (obligatorio)</h3>
                <TextArea
                  label="Razón o motivo"
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  rows={2}
                  placeholder="Indicá por qué se cancela el evento"
                  required
                />
              </div>
            )}
            {estado === "REALIZADO" && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Datos del evento realizado</h3>
                <Input
                  label="Cantidad de asistentes"
                  type="number"
                  min={0}
                  value={realizacionAsistentes}
                  onChange={(e) => setRealizacionAsistentes(e.target.value)}
                  placeholder="Ej: 120"
                />
                <TextArea
                  label="Impacto / comentarios"
                  value={realizacionImpacto}
                  onChange={(e) => setRealizacionImpacto(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción del impacto o resultado"
                  className="mt-3"
                />
              </div>
            )}
            {estadoOptions.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Estado"
                  options={estadoOptions}
                  value={estado}
                  onChange={(e) => handleEstadoChange(e.target.value as EventStatus)}
                />
              </div>
            )}
            <TextArea
              label="Resumen (opcional)"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              rows={3}
              placeholder="El evento se va a hacer en [lugar], se necesita producción [detalle], catering [detalle]..."
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Documentos PDF (opcional)
              </label>
              <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <span>Agregar PDF</span>
              </label>
              <p className="text-slate-500 text-xs mt-1">Máx. 10 MB por archivo</p>
              {archivosPdf.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {archivosPdf.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-slate-50 text-sm"
                    >
                      <span className="truncate">📄 {f.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArchivo(i)}
                        className="text-red-600 hover:text-red-800 text-xs shrink-0"
                      >
                        Quitar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {err && (
              <p className="text-red-600 text-sm" role="alert">
                {err instanceof Error ? err.message : "Error"}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando…" : "Guardar"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(isNew ? "/" : `/events/${id}`)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Modal
        title={confirmModal?.action === "CONFIRMADO" ? "Confirmar evento" : "Cancelar evento"}
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
      >
        {confirmModal && (
          <div className="space-y-4">
            <p className="text-slate-600">
              {confirmModal.action === "CONFIRMADO"
                ? "¿Marcar este evento como confirmado?"
                : "¿Marcar este evento como cancelado?"}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmModal(null)}>
                No
              </Button>
              <Button onClick={confirmEstadoChange}>Sí</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
