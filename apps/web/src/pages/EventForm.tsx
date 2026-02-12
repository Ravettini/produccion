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
import { eventStatusLabels } from "../utils/labels";

const statusOptions = (Object.entries(eventStatusLabels) as [EventStatus, string][]).map(
  ([value, label]) => ({ value, label })
);

const TIPO_OPCIONES = [
  { value: "Producción", label: "Producción" },
  { value: "Institucionales", label: "Institucionales" },
  { value: "Cobertura", label: "Cobertura" },
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
  const [estado, setEstado] = useState<EventStatus>("BORRADOR");
  const [resumen, setResumen] = useState("");
  const [publico, setPublico] = useState<"EXTERNO" | "INTERNO" | "MIXTO" | "">("");
  const [usuarioSolicitante, setUsuarioSolicitante] = useState("");
  const [lugar, setLugar] = useState("");
  const [programa, setPrograma] = useState("");
  const [imagenBuscadaSugerida, setImagenBuscadaSugerida] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ action: "CONFIRMADO" | "CANCELADO" } | null>(null);
  const [tipoError, setTipoError] = useState("");
  const [archivosPdf, setArchivosPdf] = useState<File[]>([]);

  const { data: existing } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !isNew,
  });

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
      setImagenBuscadaSugerida(existing.imagenBuscadaSugerida ?? "");
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
    if (isNew) {
      create.mutate({
        titulo,
        descripcion,
        tipoEvento: tipoEventoValue,
        areaSolicitante,
        fechaTentativa: fechaTentativa || new Date().toISOString().slice(0, 10),
        estado: isDirectorGeneral ? "EN_ANALISIS" : isAdmin ? estado : "BORRADOR",
        resumen: resumen.trim() || undefined,
        publico: publico || undefined,
        usuarioSolicitante: usuarioSolicitante.trim() || undefined,
        lugar: lugar.trim() || undefined,
        programa: programa.trim() || undefined,
        imagenBuscadaSugerida: imagenBuscadaSugerida.trim() || undefined,
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
          imagenBuscadaSugerida: imagenBuscadaSugerida.trim() || null,
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

  const estadoOptions = isAdmin
    ? statusOptions
    : statusOptions.filter((o) => o.value !== "CONFIRMADO");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">
        {isNew ? "Nuevo evento" : "Editar evento"}
      </h1>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Nombre del evento"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Área solicitante"
                value={areaSolicitante}
                onChange={(e) => setAreaSolicitante(e.target.value)}
                required
              />
              <Input
                label="Fecha tentativa"
                type="date"
                value={fechaTentativa}
                onChange={(e) => setFechaTentativa(e.target.value)}
                required
              />
            </div>
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
            <Input
              label="Lugar o dirección (opcional)"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Auditorio Lezama, Av. Pedro Goyena 1054"
            />
            <Input
              label="Programa / funcionarios (opcional)"
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
              placeholder="Programa o funcionarios clave para el brief"
            />
            <TextArea
              label="Imagen buscada sugerida (opcional)"
              value={imagenBuscadaSugerida}
              onChange={(e) => setImagenBuscadaSugerida(e.target.value)}
              rows={2}
              placeholder="Descripción de la imagen o toma sugerida para el evento"
            />
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
