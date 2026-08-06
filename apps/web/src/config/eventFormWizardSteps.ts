export type EventFormStepId =
  | "titulo"
  | "dg-fecha"
  | "tipo"
  | "publico"
  | "personas"
  | "requisitos"
  | "horarios"
  | "lugar"
  | "descripcion"
  | "complementos"
  | "catering"
  | "cobertura"
  | "produccion"
  | "cierre"
  | "estado-extra";

export interface WizardStepDef {
  id: EventFormStepId;
  label: string;
  title: string;
  subtitle?: string;
}

const STEP: Record<EventFormStepId, WizardStepDef> = {
  titulo: {
    id: "titulo",
    label: "Nombre",
    title: "¿Cómo se llama el evento?",
    subtitle: "Usá un nombre claro que identifique la actividad institucional.",
  },
  "dg-fecha": {
    id: "dg-fecha",
    label: "Área y fecha",
    title: "¿Quién solicita y para qué fecha?",
    subtitle: "El área solicitante y la fecha tentativa del evento.",
  },
  tipo: {
    id: "tipo",
    label: "Requerimiento",
    title: "¿Qué tipo de requerimiento necesitás?",
    subtitle: "Podés elegir más de una opción. Solo verás preguntas de lo que marques.",
  },
  publico: {
    id: "publico",
    label: "Público",
    title: "¿A quién está dirigido?",
    subtitle: "Definí si el evento es interno, externo o mixto.",
  },
  personas: {
    id: "personas",
    label: "Personas",
    title: "¿Cuántas personas participarán?",
    subtitle: "Estimación de asistencia para sugerir locaciones del catálogo 2026.",
  },
  requisitos: {
    id: "requisitos",
    label: "Requisitos",
    title: "¿Qué debe tener el espacio?",
    subtitle: "Mobiliario, técnica y otros filtros para sugerir locaciones.",
  },
  horarios: {
    id: "horarios",
    label: "Horarios",
    title: "¿En qué horarios se realizará?",
    subtitle: "Convocatoria, comienzo y finalización del evento.",
  },
  lugar: {
    id: "lugar",
    label: "Lugar",
    title: "¿Dónde querés hacerlo?",
    subtitle: "Elegí hasta 3 locaciones posibles. Después Producción confirma cuál quedó.",
  },
  descripcion: {
    id: "descripcion",
    label: "Descripción",
    title: "Contanos más del evento",
    subtitle: "Objetivo, dinámica y cualquier detalle relevante para el brief.",
  },
  complementos: {
    id: "complementos",
    label: "Extras",
    title: "¿Hay datos adicionales?",
    subtitle: "Según el tipo de requerimiento: programa, funcionarios u otros.",
  },
  catering: {
    id: "catering",
    label: "Catering",
    title: "¿Necesitás catering?",
    subtitle: "Coffee break, almuerzo u otro servicio de comida.",
  },
  cobertura: {
    id: "cobertura",
    label: "Cobertura",
    title: "Datos de cobertura audiovisual",
    subtitle: "Información para el brief de comunicación y/o registro del evento.",
  },
  produccion: {
    id: "produccion",
    label: "Producción",
    title: "¿Qué necesitás en producción?",
    subtitle: "Técnica, pantallas, sonido y materiales.",
  },
  cierre: {
    id: "cierre",
    label: "Cierre",
    title: "Estado del evento",
    subtitle: "Solo administración puede ajustar el estado al guardar.",
  },
  "estado-extra": {
    id: "estado-extra",
    label: "Estado",
    title: "Datos del estado",
    subtitle: undefined,
  },
};

/** Pasos del wizard según tipos elegidos: no se preguntan secciones no solicitadas. */
export function buildWizardSteps(input: {
  tipoSeleccionados: string[];
  isEdit: boolean;
  estado: string;
  /** Solo admin: paso de estado al final */
  includeCierre?: boolean;
}): WizardStepDef[] {
  const tieneProduccion = input.tipoSeleccionados.includes("Producción");
  const tieneCobertura = input.tipoSeleccionados.includes("Cobertura");

  const steps: WizardStepDef[] = [
    STEP.titulo,
    STEP["dg-fecha"],
    STEP.tipo,
    STEP.publico,
    STEP.personas,
  ];

  // Requisitos de espacio (mobiliario/técnica) solo si hay Producción
  if (tieneProduccion) {
    steps.push(STEP.requisitos);
  }

  steps.push(STEP.horarios, STEP.lugar, STEP.descripcion, STEP.complementos);

  if (tieneProduccion) {
    steps.push(STEP.catering, STEP.produccion);
  }

  if (tieneCobertura) {
    steps.push(STEP.cobertura);
  }

  if (input.includeCierre) {
    steps.push(STEP.cierre);
  }

  if (input.isEdit && (input.estado === "CANCELADO" || input.estado === "REALIZADO")) {
    steps.push({
      ...STEP["estado-extra"],
      title:
        input.estado === "CANCELADO"
          ? "Motivo de la cancelación"
          : "Datos del evento realizado",
      subtitle:
        input.estado === "CANCELADO"
          ? "Es obligatorio indicar la razón."
          : "Asistentes e impacto del evento.",
    });
  }

  return steps;
}
