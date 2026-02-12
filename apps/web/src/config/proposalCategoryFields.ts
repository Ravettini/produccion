import type { ProposalCategory } from "../types";

export interface CategoryFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "time" | "date" | "number";
  placeholder?: string;
}

export const categoryExtraFields: Record<ProposalCategory, CategoryFieldConfig[]> = {
  PRODUCCION: [
    { key: "horarioCitacion", label: "Horario de citación", type: "text", placeholder: "Ej: 9:00 hs" },
    { key: "lugar", label: "Lugar", type: "text", placeholder: "Lugar de realización" },
    { key: "cantidadPersonas", label: "Cantidad de personas", type: "number", placeholder: "Ej: 50" },
    { key: "equipamiento", label: "Equipamiento necesario", type: "textarea", placeholder: "Listado de equipos" },
  ],
  AGENDA: [
    { key: "horario", label: "Horario", type: "text", placeholder: "Ej: 10:00 a 12:00" },
    { key: "fechaEspecifica", label: "Fecha específica", type: "date" },
    { key: "duracionEstimada", label: "Duración estimada", type: "text", placeholder: "Ej: 2 horas" },
  ],
  LOGISTICA: [
    { key: "lugar", label: "Lugar", type: "text", placeholder: "Lugar de montaje/entrega" },
    { key: "horarioMontaje", label: "Horario de montaje", type: "text", placeholder: "Ej: 8:00 hs" },
  ],
  CATERING: [
    { key: "cantidadPersonas", label: "Cantidad de personas", type: "number", placeholder: "Ej: 30" },
    { key: "restriccionesAlimentarias", label: "Restricciones alimentarias", type: "textarea", placeholder: "Vegano, sin TACC, etc." },
  ],
  TECNICA: [
    { key: "equipamiento", label: "Equipamiento necesario", type: "textarea", placeholder: "Listado de equipos técnicos" },
    { key: "requerimientosTecnicos", label: "Requerimientos técnicos", type: "textarea", placeholder: "Conectividad, potencia, etc." },
  ],
  OTRO: [],
};
