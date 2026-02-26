import type { ProposalCategory } from "../types";

export interface CategoryFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "time" | "date" | "number" | "select";
  placeholder?: string;
  /** Para type "select": opciones { value, label } */
  options?: { value: string; label: string }[];
}

export const categoryExtraFields: Record<ProposalCategory, CategoryFieldConfig[]> = {
  PRODUCCION: [
    { key: "horarioCitacion", label: "Horario de citación", type: "text", placeholder: "Ej: 9:00 hs" },
    { key: "lugar", label: "Lugar", type: "text", placeholder: "Lugar de realización" },
    { key: "cantidadPersonas", label: "Cantidad de personas", type: "number", placeholder: "Ej: 50" },
    { key: "equipamiento", label: "Equipamiento necesario", type: "textarea", placeholder: "Listado de equipos" },
    // Técnica (incluida en Producción)
    {
      key: "pantallaLED",
      label: "Pantalla LED",
      type: "select",
      options: [
        { value: "", label: "—" },
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    { key: "pantallaLEDCantidad", label: "Cantidad pantallas LED", type: "number", placeholder: "Ej: 1" },
    {
      key: "pantallaRetractil",
      label: "Pantalla retráctil",
      type: "select",
      options: [
        { value: "", label: "—" },
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "proyector",
      label: "Proyector",
      type: "select",
      options: [
        { value: "", label: "—" },
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "sonido",
      label: "Sonido",
      type: "select",
      options: [
        { value: "", label: "—" },
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "microfonos",
      label: "Micrófonos",
      type: "select",
      options: [
        { value: "", label: "—" },
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
      ],
    },
    { key: "microfonosCantidad", label: "Cantidad de micrófonos", type: "number", placeholder: "Ej: 2" },
    { key: "requerimientosTecnicos", label: "Requerimientos técnicos", type: "textarea", placeholder: "Conectividad, potencia, etc." },
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

/** Campos de catering (fuera de Producción; se usan en formulario de evento y en brief) */
export const cateringFields: CategoryFieldConfig[] = [
  { key: "catering", label: "¿Catering?", type: "select", options: [{ value: "", label: "—" }, { value: "si", label: "Sí" }, { value: "no", label: "No" }] },
  {
    key: "tipoCatering",
    label: "Tipo de catering",
    type: "select",
    options: [
      { value: "", label: "—" },
      { value: "desayuno", label: "Desayuno" },
      { value: "almuerzo", label: "Almuerzo" },
      { value: "cena", label: "Cena" },
      { value: "coffee break", label: "Coffee break" },
    ],
  },
  { key: "cateringCantidad", label: "Cantidad catering (personas)", type: "number", placeholder: "Ej: 50" },
  { key: "restriccionesAlimentarias", label: "Restricciones alimentarias", type: "textarea", placeholder: "Vegano, sin TACC, etc." },
];

/** Campos de pedido de piezas de comunicación (fuera de Producción; se usan en formulario de evento y en brief) */
export const comunicacionPiezasFields: CategoryFieldConfig[] = [
  { key: "comunicacionPieza", label: "¿Qué pieza se necesita?", type: "text", placeholder: "Ej: afiche, gacetilla, banner" },
  { key: "comunicacionMedio", label: "¿Para qué medio?", type: "text", placeholder: "Ej: redes, prensa, impreso" },
  { key: "comunicacionMensajeClave", label: "¿Cuál es el mensaje clave?", type: "text", placeholder: "Mensaje principal a comunicar" },
  { key: "comunicacionRestriccionesDiseno", label: "¿Restricciones de diseño?", type: "text", placeholder: "Ej: colores institucionales" },
  { key: "comunicacionPlazoEntrega", label: "¿Plazo de entrega?", type: "text", placeholder: "Ej: 5 días hábiles antes" },
];
