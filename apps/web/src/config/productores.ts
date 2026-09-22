/**
 * Equipo de producción — campo Productor en eventos.
 */
export const PRODUCTORES_EQUIPO = [
  "Romina Mamczak",
  "Gabriela Lorenzo",
  "Iker Belardi",
  "Rochy Varillas",
] as const;

export const PRODUCTORES_OPTIONS = PRODUCTORES_EQUIPO.map((name) => ({
  value: name,
  label: name,
}));
