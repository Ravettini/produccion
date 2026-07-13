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

const BASE_STEPS: WizardStepDef[] = [
  {
    id: "titulo",
    label: "Nombre",
    title: "¿Cómo se llama el evento?",
    subtitle: "Usá un nombre claro que identifique la actividad institucional.",
  },
  {
    id: "dg-fecha",
    label: "DG y fecha",
    title: "¿Quién solicita y para qué fecha?",
    subtitle: "La dirección general y la fecha tentativa del evento.",
  },
  {
    id: "tipo",
    label: "Tipo",
    title: "¿Qué tipo de apoyo necesitás?",
    subtitle: "Podés elegir más de una opción.",
  },
  {
    id: "publico",
    label: "Público",
    title: "¿A quién está dirigido?",
    subtitle: "Definí si el evento es interno, externo o mixto.",
  },
  {
    id: "personas",
    label: "Personas",
    title: "¿Cuántas personas participarán?",
    subtitle: "Estimación de asistencia para sugerir locaciones del catálogo 2026.",
  },
  {
    id: "requisitos",
    label: "Requisitos",
    title: "¿Qué debe tener el espacio?",
    subtitle: "Marcá solo lo que sea obligatorio para filtrar sugerencias.",
  },
  {
    id: "horarios",
    label: "Horarios",
    title: "¿En qué horarios se realizará?",
    subtitle: "Convocatoria, comienzo y finalización del evento.",
  },
  {
    id: "lugar",
    label: "Lugar",
    title: "¿Dónde querés hacerlo?",
    subtitle: "Elegí una locación sugerida o buscá en el catálogo completo.",
  },
  {
    id: "descripcion",
    label: "Descripción",
    title: "Contanos más del evento",
    subtitle: "Objetivo, dinámica y cualquier detalle relevante para el brief.",
  },
  {
    id: "complementos",
    label: "Extras",
    title: "¿Hay datos adicionales?",
    subtitle: "Programa, funcionario, referente y acreditación (opcional).",
  },
  {
    id: "catering",
    label: "Catering",
    title: "¿Necesitás catering?",
    subtitle: "Coffee break, almuerzo u otro servicio de comida.",
  },
  {
    id: "cierre",
    label: "Cierre",
    title: "¿Algo más antes de guardar?",
    subtitle: "Resumen opcional y documentos PDF de apoyo.",
  },
];

export function buildWizardSteps(input: {
  tipoSeleccionados: string[];
  isEdit: boolean;
  estado: string;
}): WizardStepDef[] {
  const steps = [...BASE_STEPS];
  const insertBefore = steps.findIndex((s) => s.id === "cierre");

  if (input.tipoSeleccionados.includes("Cobertura")) {
    steps.splice(insertBefore, 0, {
      id: "cobertura",
      label: "Cobertura",
      title: "Datos de cobertura audiovisual",
      subtitle: "Información para el brief de comunicación y/o registro del evento.",
    });
  }

  if (input.tipoSeleccionados.includes("Producción")) {
    steps.splice(insertBefore, 0, {
      id: "produccion",
      label: "Producción",
      title: "¿Qué necesitás en producción?",
      subtitle: "Técnica, pantallas, sonido y materiales.",
    });
  }

  if (
    input.isEdit &&
    (input.estado === "CANCELADO" || input.estado === "REALIZADO")
  ) {
    steps.push({
      id: "estado-extra",
      label: "Estado",
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
