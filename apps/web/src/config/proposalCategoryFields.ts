import type { ProposalCategory } from "../types";

export interface CategoryFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "time" | "date" | "number" | "select";
  placeholder?: string;
  /** Para type "select": opciones { value, label } */
  options?: { value: string; label: string }[];
}

const SI_NO: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

const RESTRICCIONES_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "ninguna", label: "Ninguna" },
  { value: "vegano", label: "Vegano" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "sin TACC", label: "Sin TACC" },
  { value: "sin lactosa", label: "Sin lactosa" },
  { value: "varias", label: "Varias (a coordinar)" },
];

const REQUERIMIENTOS_TECNICOS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "ninguno", label: "Ninguno adicional" },
  { value: "wifi", label: "WiFi / conectividad" },
  { value: "potencia", label: "Potencia eléctrica extra" },
  { value: "streaming", label: "Streaming / transmisión" },
  { value: "traduccion", label: "Traducción / interpretación" },
  { value: "varios", label: "Varios (a coordinar)" },
];

const EQUIPAMIENTO_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "basico", label: "Básico (sonido + micrófono)" },
  { value: "audiovisual", label: "Audiovisual (pantalla / proyector)" },
  { value: "completo", label: "Completo (sonido + AV)" },
  { value: "ninguno", label: "Sin equipamiento extra" },
];

export const categoryExtraFields: Record<ProposalCategory, CategoryFieldConfig[]> = {
  PRODUCCION: [
    { key: "horarioCitacion", label: "Horario de citación", type: "text", placeholder: "Ej: 9:00 hs" },
    { key: "lugar", label: "Lugar", type: "text", placeholder: "Lugar de realización" },
    { key: "cantidadPersonas", label: "Cantidad de personas", type: "number", placeholder: "Ej: 50" },
    {
      key: "equipamiento",
      label: "Equipamiento necesario",
      type: "select",
      options: EQUIPAMIENTO_OPTIONS,
    },
    // Técnica (incluida en Producción)
    { key: "pantallaLED", label: "Pantalla LED", type: "select", options: SI_NO },
    { key: "pantallaLEDCantidad", label: "Cantidad pantallas LED", type: "number", placeholder: "Ej: 1" },
    { key: "pantallaRetractil", label: "Pantalla para proyector", type: "select", options: SI_NO },
    { key: "proyector", label: "Proyector", type: "select", options: SI_NO },
    { key: "sonido", label: "Sonido", type: "select", options: SI_NO },
    { key: "microfonos", label: "Micrófonos", type: "select", options: SI_NO },
    { key: "microfonosCantidad", label: "Cantidad de micrófonos", type: "number", placeholder: "Ej: 2" },
    {
      key: "requerimientosTecnicos",
      label: "Requerimientos técnicos",
      type: "select",
      options: REQUERIMIENTOS_TECNICOS_OPTIONS,
    },
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
    { key: "cantidadPersonas", label: "Cantidad de personas", type: "number", placeholder: "Ej: 30" },
    {
      key: "restriccionesAlimentarias",
      label: "Restricciones alimentarias",
      type: "select",
      options: RESTRICCIONES_OPTIONS,
    },
  ],
  TECNICA: [
    {
      key: "equipamiento",
      label: "Equipamiento necesario",
      type: "select",
      options: EQUIPAMIENTO_OPTIONS,
    },
    {
      key: "requerimientosTecnicos",
      label: "Requerimientos técnicos",
      type: "select",
      options: REQUERIMIENTOS_TECNICOS_OPTIONS,
    },
  ],
  OTRO: [],
};

/** Campos de catering (fuera de Producción; se usan en formulario de evento y en brief) */
export const cateringFields: CategoryFieldConfig[] = [
  { key: "catering", label: "¿Catering?", type: "select", options: SI_NO },
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
  {
    key: "restriccionesAlimentarias",
    label: "Restricciones alimentarias",
    type: "select",
    options: RESTRICCIONES_OPTIONS,
  },
];

/** Campos del brief audiovisual (modelo: piezas de comunicación y/o cobertura) */
export const COBERTURA_CANALES_BASE: { value: string; label: string }[] = [
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "YouTube", label: "YouTube" },
  { value: "Mailing", label: "Mailing" },
  { value: "Prensa", label: "Prensa" },
  { value: "Web institucional", label: "Web institucional" },
  { value: "Otro", label: "Otro" },
];

export const INSTAGRAM_CUENTAS: { value: string; label: string }[] = [
  { value: "Instagram AC", label: "Instagram AC" },
  { value: "Instagram BADA", label: "Instagram BADA" },
  { value: "Instagram BA JOVEN", label: "Instagram BA JOVEN" },
  { value: "Instagram BA BIENESTAR", label: "Instagram BA BIENESTAR" },
];

export const LINKEDIN_CUENTAS: { value: string; label: string }[] = [
  { value: "LinkedIn SSCCYRS", label: "LinkedIn SSCCYRS" },
  { value: "LinkedIn BADA", label: "LinkedIn BADA" },
];

/** Materiales extra (paso producción) */
export const MATERIALES_EXTRA_OPTIONS: { value: string; label: string }[] = [
  { value: "Rotafolios", label: "Rotafolios" },
  { value: "Cliperas", label: "Cliperas" },
  { value: "Lapiceras", label: "Lapiceras" },
  { value: "Marcadores", label: "Marcadores" },
  { value: "Post it", label: "Post it" },
  { value: "Hojas A4", label: "Hojas A4" },
  { value: "Afiche blanco", label: "Afiche blanco" },
  { value: "Back de prensa", label: "Back de prensa" },
  { value: "Banner", label: "Banner" },
  { value: "Pasa slide", label: "Pasa slide" },
  { value: "Cable HDMI", label: "Cable HDMI" },
  { value: "Alargues / zapatillas", label: "Alargues / zapatillas" },
];

export const coberturaBriefFields: CategoryFieldConfig[] = [
  {
    key: "coberturaObjetivo",
    label: "¿Qué querés comunicar?",
    type: "textarea",
    placeholder: "Objetivo principal del contenido",
  },
  {
    key: "comunicacionMedio",
    label: "¿Por qué canal va a salir?",
    type: "select",
    options: COBERTURA_CANALES_BASE,
  },
  {
    key: "coberturaDuracion",
    label: "Duración aproximada",
    type: "select",
    options: [
      { value: "", label: "Seleccionar…" },
      { value: "Menos de 1 minuto", label: "Menos de 1 minuto" },
      { value: "1 a 3 minutos", label: "1 a 3 minutos" },
      { value: "3 a 10 minutos", label: "3 a 10 minutos" },
      { value: "Más de 10 minutos", label: "Más de 10 minutos" },
      { value: "Evento completo", label: "Evento completo" },
    ],
  },
  {
    key: "coberturaFormato",
    label: "Formato",
    type: "select",
    options: [
      { value: "", label: "Seleccionar…" },
      { value: "Historia", label: "Historia" },
      { value: "Reel", label: "Reel" },
      { value: "Carrusel", label: "Carrusel" },
      { value: "Video", label: "Video" },
      { value: "Foto", label: "Foto" },
      { value: "Streaming", label: "Streaming" },
      { value: "Otro", label: "Otro" },
    ],
  },
  {
    key: "coberturaOrientacion",
    label: "Orientación",
    type: "select",
    options: [
      { value: "", label: "—" },
      { value: "horizontal", label: "Horizontal" },
      { value: "vertical", label: "Vertical" },
    ],
  },
  {
    key: "referenteLugarContacto",
    label: "Contacto del referente del lugar",
    type: "text",
    placeholder: "Nombre, teléfono o email",
  },
];

/** @deprecated Usar coberturaBriefFields */
export const comunicacionPiezasFields: CategoryFieldConfig[] = [
  { key: "comunicacionPieza", label: "¿Qué pieza se necesita?", type: "text", placeholder: "Ej: afiche, gacetilla, banner" },
  { key: "comunicacionMedio", label: "¿Para qué medio?", type: "text", placeholder: "Ej: redes, prensa, impreso" },
  { key: "comunicacionMensajeClave", label: "¿Cuál es el mensaje clave?", type: "text", placeholder: "Mensaje principal a comunicar" },
  { key: "comunicacionRestriccionesDiseno", label: "¿Restricciones de diseño?", type: "text", placeholder: "Ej: colores institucionales" },
  { key: "comunicacionPlazoEntrega", label: "¿Plazo de entrega?", type: "text", placeholder: "Ej: 5 días hábiles antes" },
];
