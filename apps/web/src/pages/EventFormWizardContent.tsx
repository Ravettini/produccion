import type { EventStatus } from "../types";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";
import { Select } from "../components/ui/Select";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { MultiSearchableSelect } from "../components/ui/MultiSearchableSelect";
import { Button } from "../components/ui/Button";
import { ChoiceCards } from "../components/wizard/ChoiceCards";
import { LocacionesSugeridasPanel } from "../components/domain/LocacionesSugeridasPanel";
import { DIRECCIONES_GENERALES_OPTIONS } from "../config/direccionesGenerales";
import { categoryExtraFields, cateringFields, coberturaBriefFields } from "../config/proposalCategoryFields";
import { getProgramasParaArea } from "../config/programasPorArea";
import { FUNCIONARIOS_OPTIONS } from "../config/funcionarios";
import { PRODUCTORES_OPTIONS } from "../config/productores";
import type { EventFormStepId } from "../config/eventFormWizardSteps";
import type { LocacionSugerida } from "../config/locaciones2026.types";
import { eventStatusHints } from "../utils/labels";

const PRODUCCION_FORM_EXCLUDE = new Set(["horarioCitacion", "cantidadPersonas", "lugar"]);

const TIPO_OPCIONES = [
  { value: "Producción", label: "Producción", description: "Técnica, catering, materiales y comunicación." },
  { value: "Institucionales", label: "Institucionales", description: "Eventos formales con autoridades y protocolo." },
  { value: "Cobertura", label: "Cobertura", description: "Registro audiovisual, fotográfico o de prensa." },
  { value: "Otro", label: "Otro", description: "Especificá el tipo en el campo de texto." },
];

const REQUISITOS_ESPACIO = [
  { key: "requiereWifi", label: "WiFi" },
  { key: "requiereAccesibilidad", label: "Accesibilidad" },
  { key: "requiereTecnica", label: "Equipamiento técnico" },
  { key: "requiereEstacionamiento", label: "Estacionamiento" },
  { key: "requiereBackstage", label: "Backstage" },
  { key: "requiereMobiliario", label: "Mobiliario" },
] as const;

export interface EventFormWizardContentProps {
  stepId: EventFormStepId;
  titulo: string;
  setTitulo: (v: string) => void;
  areaSolicitante: string;
  setAreaSolicitante: (v: string) => void;
  fechaTentativa: string;
  setFechaTentativa: (v: string) => void;
  tipoSeleccionados: string[];
  setTipoSeleccionados: (v: string[]) => void;
  tipoOtro: string;
  setTipoOtro: (v: string) => void;
  publico: "EXTERNO" | "INTERNO" | "MIXTO" | "";
  setPublico: (v: "EXTERNO" | "INTERNO" | "MIXTO" | "") => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  datosProduccion: Record<string, string>;
  setDatosProduccion: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  lugar: string;
  setLugar: (v: string) => void;
  lugaresSugeridos: LocacionSugerida[];
  lugaresOpciones: { value: string; label: string; codigo?: string }[];
  usuarioSolicitante: string;
  setUsuarioSolicitante: (v: string) => void;
  programa: string;
  setPrograma: (v: string) => void;
  funcionario: string[];
  setFuncionario: (v: string[]) => void;
  productor: string;
  setProductor: (v: string) => void;
  necesitaAcreditacion: boolean | "";
  setNecesitaAcreditacion: (v: boolean | "") => void;
  linkAcreditacionConvocados: string;
  setLinkAcreditacionConvocados: (v: string) => void;
  resumen: string;
  setResumen: (v: string) => void;
  archivosPdf: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeArchivo: (i: number) => void;
  estado: EventStatus;
  setEstado: (v: EventStatus) => void;
  estadoOptions: { value: string; label: string }[];
  onEstadoChange: (v: EventStatus) => void;
  motivoCancelacion: string;
  setMotivoCancelacion: (v: string) => void;
  realizacionAsistentes: string;
  setRealizacionAsistentes: (v: string) => void;
  realizacionImpacto: string;
  setRealizacionImpacto: (v: string) => void;
  isAdmin: boolean;
  userArea?: string | null;
  showEstadoSelect: boolean;
}

export function EventFormWizardContent(props: EventFormWizardContentProps) {
  const {
    stepId,
    titulo,
    setTitulo,
    areaSolicitante,
    setAreaSolicitante,
    fechaTentativa,
    setFechaTentativa,
    tipoSeleccionados,
    setTipoSeleccionados,
    tipoOtro,
    setTipoOtro,
    publico,
    setPublico,
    descripcion,
    setDescripcion,
    datosProduccion,
    setDatosProduccion,
    lugar,
    setLugar,
    lugaresSugeridos,
    lugaresOpciones,
    usuarioSolicitante,
    setUsuarioSolicitante,
    programa,
    setPrograma,
    funcionario,
    setFuncionario,
    productor,
    setProductor,
    necesitaAcreditacion,
    setNecesitaAcreditacion,
    linkAcreditacionConvocados,
    setLinkAcreditacionConvocados,
    resumen,
    setResumen,
    archivosPdf,
    onFileChange,
    removeArchivo,
    estado,
    motivoCancelacion,
    setMotivoCancelacion,
    realizacionAsistentes,
    setRealizacionAsistentes,
    realizacionImpacto,
    setRealizacionImpacto,
    isAdmin,
    userArea,
    showEstadoSelect,
    estadoOptions,
    onEstadoChange,
  } = props;

  const areaParaProgramas = userArea && !isAdmin ? userArea : areaSolicitante.trim();
  const opcionesPrograma = getProgramasParaArea(areaParaProgramas);

  switch (stepId) {
    case "titulo":
      return (
        <Input
          label=""
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          placeholder="Ej: Jornada de Gobierno Abierto"
          className="text-center text-lg"
        />
      );

    case "dg-fecha":
      return (
        <div className="space-y-4">
          {userArea && !isAdmin ? (
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">DG solicitante</p>
              <p className="font-medium text-slate-900">{userArea}</p>
            </div>
          ) : !userArea && !isAdmin ? (
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
              options={[{ value: "", label: "Seleccionar DG…" }, ...DIRECCIONES_GENERALES_OPTIONS]}
              value={areaSolicitante}
              onChange={(e) => setAreaSolicitante(e.target.value)}
            />
          )}
          <Input
            label="Fecha tentativa"
            type="date"
            value={fechaTentativa}
            onChange={(e) => setFechaTentativa(e.target.value)}
            required
          />
        </div>
      );

    case "tipo":
      return (
        <div className="space-y-4">
          <ChoiceCards
            options={TIPO_OPCIONES}
            value={tipoSeleccionados}
            onChange={(v) => setTipoSeleccionados(v as string[])}
            multiple
            columns={2}
          />
          {tipoSeleccionados.includes("Otro") && (
            <Input
              label="Especificá el otro tipo"
              value={tipoOtro}
              onChange={(e) => setTipoOtro(e.target.value)}
              placeholder="Ej: Jornada, Seminario…"
            />
          )}
        </div>
      );

    case "publico":
      return (
        <ChoiceCards
          options={[
            { value: "INTERNO", label: "Interno", description: "Solo personal del gobierno." },
            { value: "EXTERNO", label: "Externo", description: "Público general o invitados externos." },
            { value: "MIXTO", label: "Mixto", description: "Combinación de ambos." },
          ]}
          value={publico}
          onChange={(v) => setPublico(v as typeof publico)}
          columns={1}
        />
      );

    case "personas":
      return (
        <Input
          label=""
          type="number"
          min={1}
          value={datosProduccion.cantidadPersonas ?? ""}
          onChange={(e) =>
            setDatosProduccion((prev) => ({ ...prev, cantidadPersonas: e.target.value }))
          }
          placeholder="Ej: 80"
          className="text-center text-lg"
        />
      );

    case "requisitos":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {REQUISITOS_ESPACIO.map(({ key, label }) => (
            <Select
              key={key}
              label={label}
              options={[
                { value: "", label: "Indistinto" },
                { value: "si", label: "Sí, obligatorio" },
                { value: "no", label: "No necesito" },
              ]}
              value={datosProduccion[key] ?? ""}
              onChange={(e) =>
                setDatosProduccion((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          ))}
        </div>
      );

    case "horarios":
      return (
        <div className="grid gap-4 grid-cols-1">
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
      );

    case "lugar":
      return (
        <div className="space-y-5">
          <SearchableSelect
            label="Buscar locación"
            placeholder="Buscar en el catálogo…"
            searchPlaceholder="Sede, nombre o dirección…"
            options={[
              { value: "", label: "Seleccionar lugar…" },
              ...lugaresOpciones,
              ...(lugar && !lugaresOpciones.some((l) => l.value === lugar)
                ? [{ value: lugar, label: lugar }]
                : []),
            ]}
            value={lugar}
            onChange={setLugar}
            emptyMessage="Sin resultados"
          />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Sugerencias</h3>
            <p className="text-xs text-slate-500 mb-3">
              Según cantidad de personas y requisitos del espacio.
            </p>
            <LocacionesSugeridasPanel
              sugerencias={lugaresSugeridos}
              seleccionado={lugar}
              onSeleccionar={setLugar}
              maxVisible={8}
            />
          </div>
        </div>
      );

    case "descripcion":
      return (
        <TextArea
          label=""
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          rows={6}
          placeholder="Objetivo, dinámica, participantes esperados…"
        />
      );

    case "complementos":
      return (
        <div className="space-y-4">
          <Input
            label="Referente del evento (opcional)"
            value={usuarioSolicitante}
            onChange={(e) => setUsuarioSolicitante(e.target.value)}
            placeholder="Nombre de quien solicita"
          />
          {opcionesPrograma.length > 0 ? (
            <SearchableSelect
              label="Programa (opcional)"
              placeholder="Buscar programa…"
              options={[{ value: "", label: "— Sin programa —" }, ...opcionesPrograma]}
              value={programa}
              onChange={setPrograma}
            />
          ) : (
            <Input
              label="Programa (opcional)"
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
            />
          )}
          {(tipoSeleccionados.includes("Institucionales")) && (
            <MultiSearchableSelect
              label="Funcionario(s)"
              hint="Podés seleccionar varios. Quedan como chips y se guardan separados por coma."
              placeholder="Buscar y marcar uno o más funcionarios…"
              searchPlaceholder="Buscar por nombre…"
              options={[
                { value: "Otro", label: "Otro" },
                ...FUNCIONARIOS_OPTIONS,
              ]}
              value={funcionario}
              onChange={setFuncionario}
              emptyMessage="Ningún funcionario coincide"
            />
          )}
          {tipoSeleccionados.includes("Producción") && (
            <SearchableSelect
              label="Productor"
              placeholder="Seleccionar productor del equipo…"
              searchPlaceholder="Buscar productor…"
              options={[
                { value: "", label: "— Sin productor —" },
                ...PRODUCTORES_OPTIONS,
              ]}
              value={productor}
              onChange={setProductor}
              emptyMessage="Ningún productor coincide"
            />
          )}
          <Select
            label="¿Se necesita acreditación?"
            options={[
              { value: "", label: "Seleccionar…" },
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ]}
            value={necesitaAcreditacion === "" ? "" : necesitaAcreditacion ? "true" : "false"}
            onChange={(e) =>
              setNecesitaAcreditacion(e.target.value === "" ? "" : e.target.value === "true")
            }
          />
          {necesitaAcreditacion === true && (
            <Input
              label="Link a convocados"
              value={linkAcreditacionConvocados}
              onChange={(e) => setLinkAcreditacionConvocados(e.target.value)}
              placeholder="URL del formulario"
            />
          )}
        </div>
      );

    case "catering":
      return (
        <div className="space-y-3">
          {cateringFields.filter((f) => f.key === "catering").map((field) => (
            <Select
              key={field.key}
              label={field.label}
              options={field.options ?? []}
              value={datosProduccion[field.key] ?? ""}
              onChange={(e) =>
                setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          ))}
          {datosProduccion.catering === "si" &&
            cateringFields
              .filter((f) => f.key !== "catering")
              .map((field) =>
                field.type === "select" && field.options?.length ? (
                  <Select
                    key={field.key}
                    label={field.label}
                    options={field.options}
                    value={datosProduccion[field.key] ?? ""}
                    onChange={(e) =>
                      setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                ) : (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={datosProduccion[field.key] ?? ""}
                    onChange={(e) =>
                      setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    type={field.type === "number" ? "number" : "text"}
                    placeholder={field.placeholder}
                  />
                )
              )}
        </div>
      );

    case "cobertura":
      return (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {coberturaBriefFields.map((field) =>
            field.type === "textarea" ? (
              <TextArea
                key={field.key}
                label={field.label}
                value={datosProduccion[field.key] ?? ""}
                onChange={(e) =>
                  setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                rows={2}
              />
            ) : field.type === "select" && field.options?.length ? (
              <Select
                key={field.key}
                label={field.label}
                options={field.options}
                value={datosProduccion[field.key] ?? ""}
                onChange={(e) =>
                  setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            ) : (
              <Input
                key={field.key}
                label={field.label}
                value={datosProduccion[field.key] ?? ""}
                onChange={(e) =>
                  setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            )
          )}
        </div>
      );

    case "produccion":
      return (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {categoryExtraFields.PRODUCCION.filter((f) => !PRODUCCION_FORM_EXCLUDE.has(f.key)).map(
            (field) => (
              <div key={field.key}>
                {field.type === "textarea" ? (
                  <TextArea
                    label={field.label}
                    value={datosProduccion[field.key] ?? ""}
                    onChange={(e) =>
                      setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    rows={2}
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
                    value={datosProduccion[field.key] ?? ""}
                    onChange={(e) =>
                      setDatosProduccion((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    type={field.type === "number" ? "number" : "text"}
                  />
                )}
              </div>
            )
          )}
        </div>
      );

    case "cierre":
      return (
        <div className="space-y-4">
          {showEstadoSelect && (
            <div className="space-y-1.5">
              <Select
                label="Estado del evento"
                options={estadoOptions}
                value={estado}
                onChange={(e) => onEstadoChange(e.target.value as EventStatus)}
              />
              {eventStatusHints[estado] && (
                <p className="text-xs text-slate-500 px-0.5">{eventStatusHints[estado]}</p>
              )}
            </div>
          )}
          <TextArea
            label="Resumen (opcional)"
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            rows={3}
            placeholder="Resumen para el brief…"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Documentos PDF (opcional)
            </label>
            <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={onFileChange}
                className="hidden"
                multiple
              />
              <span>Agregar PDF</span>
            </label>
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
                      className="text-red-600 text-xs shrink-0"
                    >
                      Quitar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );

    case "estado-extra":
      if (estado === "CANCELADO") {
        return (
          <TextArea
            label="Motivo de cancelación"
            value={motivoCancelacion}
            onChange={(e) => setMotivoCancelacion(e.target.value)}
            rows={4}
            required
            placeholder="Indicá por qué se cancela el evento"
          />
        );
      }
      return (
        <div className="space-y-4">
          <Input
            label="Cantidad de asistentes"
            type="number"
            min={0}
            value={realizacionAsistentes}
            onChange={(e) => setRealizacionAsistentes(e.target.value)}
          />
          <TextArea
            label="Impacto / comentarios"
            value={realizacionImpacto}
            onChange={(e) => setRealizacionImpacto(e.target.value)}
            rows={3}
          />
        </div>
      );

    default:
      return null;
  }
}
