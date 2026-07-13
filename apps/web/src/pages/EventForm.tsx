import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvent, createEvent, updateEvent } from "../api/events";
import { uploadAttachment } from "../api/attachments";
import type { EventStatus } from "../types";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { WizardShell } from "../components/wizard/WizardShell";
import { eventStatusLabels } from "../utils/labels";
import { opcionesLocacionesSugeridas, criteriosDesdeProduccion, sugerirLocaciones } from "../utils/sugerirLocaciones";
import { canEditEvent } from "../hooks/usePermissions";
import { buildWizardSteps } from "../config/eventFormWizardSteps";
import type { EventFormStepId } from "../config/eventFormWizardSteps";
import { EventFormWizardContent } from "./EventFormWizardContent";

const TIPO_OPCIONES = [
  { value: "Otro", label: "Otro", title: "Otro tipo de evento (especificar en el campo siguiente)." },
  { value: "Producción", label: "Producción", title: "Incluye técnica (pantallas, sonido), catering, materiales y piezas de comunicación." },
  { value: "Institucionales", label: "Institucionales", title: "Eventos formales con autoridades, protocolo y funcionarios." },
  { value: "Cobertura", label: "Cobertura", title: "Registro audiovisual, fotográfico o de prensa del evento." },
];

const statusOptions = (Object.entries(eventStatusLabels) as [EventStatus, string][]).map(
  ([value, label]) => ({ value, label })
);

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const isDirectorGeneral = user?.role === "DIRECTOR_GENERAL";
  const [stepIndex, setStepIndex] = useState(0);
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
  const [stepError, setStepError] = useState("");
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

  const tipoEventoValue = [...tipoSeleccionados, tipoOtro.trim()].filter(Boolean).join(", ");

  const steps = useMemo(
    () =>
      buildWizardSteps({
        tipoSeleccionados,
        isEdit: !isNew,
        estado,
      }),
    [tipoSeleccionados, isNew, estado]
  );

  const currentStep = steps[stepIndex] ?? steps[0];
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const cantidadPersonas = parseInt(datosProduccion.cantidadPersonas ?? "", 10);
  const criteriosLocacion = useMemo(
    () => ({
      cantidadPersonas: !Number.isNaN(cantidadPersonas) && cantidadPersonas > 0 ? cantidadPersonas : undefined,
      ...criteriosDesdeProduccion(datosProduccion),
    }),
    [cantidadPersonas, datosProduccion]
  );
  const lugaresSugeridos = useMemo(
    () => sugerirLocaciones(criteriosLocacion, 20),
    [criteriosLocacion]
  );
  const lugaresOpciones = useMemo(
    () => opcionesLocacionesSugeridas(criteriosLocacion),
    [criteriosLocacion]
  );

  const estadoOptions = isAdmin
    ? statusOptions
    : statusOptions.filter((o) => o.value !== "CONFIRMADO");

  const showEstadoSelect = isAdmin && !isDirectorGeneral;

  const handleEstadoChange = (newEstado: EventStatus) => {
    if (newEstado === "CONFIRMADO" && !isAdmin) {
      return;
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

  const validateStep = (stepId: EventFormStepId): string | null => {
    switch (stepId) {
      case "titulo":
        if (!titulo.trim()) return "Ingresá el nombre del evento.";
        return null;
      case "dg-fecha":
        if (!fechaTentativa) return "Seleccioná una fecha tentativa.";
        if (isAdmin && !areaSolicitante.trim()) return "Seleccioná la dirección general solicitante.";
        if (!user?.area && !isAdmin && !areaSolicitante.trim()) return "Seleccioná la dirección general solicitante.";
        return null;
      case "tipo":
        if (tipoEventoValue.length === 0) return "Elegí al menos un tipo de apoyo.";
        return null;
      case "descripcion":
        if (!descripcion.trim()) return "La descripción es obligatoria.";
        return null;
      case "estado-extra":
        if (estado === "CANCELADO" && !motivoCancelacion.trim()) {
          return "Indicá el motivo de la cancelación.";
        }
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (!currentStep) return;
    const err = validateStep(currentStep.id);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepError("");
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      navigate(isNew ? "/" : `/events/${id}`);
    }
  };

  const handleFinish = () => {
    if (!currentStep) return;
    const err = validateStep(currentStep.id);
    if (err) {
      setStepError(err);
      return;
    }
    for (const step of steps) {
      const stepErr = validateStep(step.id);
      if (stepErr) {
        setStepError(stepErr);
        const idx = steps.findIndex((s) => s.id === step.id);
        if (idx >= 0) setStepIndex(idx);
        return;
      }
    }
    setStepError("");
    submitEvent();
  };

  const submitEvent = () => {
    if (!isNew && estado === "CANCELADO" && !motivoCancelacion.trim()) {
      setStepError("Al cancelar el evento es obligatorio indicar el motivo o razón.");
      return;
    }
    if (isAdmin && !areaSolicitante.trim()) {
      setStepError("Seleccioná una dirección general solicitante.");
      return;
    }
    if (tipoEventoValue.length === 0) {
      setStepError("Seleccioná al menos una opción o completá «Otro»");
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
  const displayError =
    stepError ||
    (err instanceof Error ? err.message : err ? "Error al guardar" : "");

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

  if (!currentStep) {
    return null;
  }

  const canAdvance = validateStep(currentStep.id) === null;

  return (
    <div className="fixed inset-0 z-20 lg:left-64 bg-surface overflow-y-auto">
      <div className="min-h-full flex flex-col px-4 sm:px-8 py-6 sm:py-10 max-w-3xl mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate(isNew ? "/" : `/events/${id}`)}
          className="text-sm text-slate-500 hover:text-brand-600 transition-colors mb-6 self-start"
        >
          ← {isNew ? "Volver al inicio" : "Volver al evento"}
        </button>

        <WizardShell
        title={currentStep.title}
        subtitle={currentStep.subtitle}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        stepLabel={currentStep.label}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
        canNext={canAdvance}
        isLast={isLastStep}
        isPending={isPending}
        finishLabel={isNew ? "Crear evento" : "Guardar cambios"}
        eyebrow={isNew ? "Nuevo evento" : "Editar evento"}
        error={displayError || undefined}
      >
        <EventFormWizardContent
          stepId={currentStep.id}
          titulo={titulo}
          setTitulo={setTitulo}
          areaSolicitante={areaSolicitante}
          setAreaSolicitante={setAreaSolicitante}
          fechaTentativa={fechaTentativa}
          setFechaTentativa={setFechaTentativa}
          tipoSeleccionados={tipoSeleccionados}
          setTipoSeleccionados={setTipoSeleccionados}
          tipoOtro={tipoOtro}
          setTipoOtro={setTipoOtro}
          publico={publico}
          setPublico={setPublico}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          datosProduccion={datosProduccion}
          setDatosProduccion={setDatosProduccion}
          lugar={lugar}
          setLugar={setLugar}
          lugaresSugeridos={lugaresSugeridos}
          lugaresOpciones={lugaresOpciones}
          usuarioSolicitante={usuarioSolicitante}
          setUsuarioSolicitante={setUsuarioSolicitante}
          programa={programa}
          setPrograma={setPrograma}
          funcionario={funcionario}
          setFuncionario={setFuncionario}
          necesitaAcreditacion={necesitaAcreditacion}
          setNecesitaAcreditacion={setNecesitaAcreditacion}
          linkAcreditacionConvocados={linkAcreditacionConvocados}
          setLinkAcreditacionConvocados={setLinkAcreditacionConvocados}
          resumen={resumen}
          setResumen={setResumen}
          archivosPdf={archivosPdf}
          onFileChange={handleFileChange}
          removeArchivo={removeArchivo}
          estado={estado}
          setEstado={setEstado}
          estadoOptions={estadoOptions}
          onEstadoChange={handleEstadoChange}
          motivoCancelacion={motivoCancelacion}
          setMotivoCancelacion={setMotivoCancelacion}
          realizacionAsistentes={realizacionAsistentes}
          setRealizacionAsistentes={setRealizacionAsistentes}
          realizacionImpacto={realizacionImpacto}
          setRealizacionImpacto={setRealizacionImpacto}
          isAdmin={isAdmin}
          userArea={user?.area}
          showEstadoSelect={showEstadoSelect}
        />
      </WizardShell>
      </div>

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
