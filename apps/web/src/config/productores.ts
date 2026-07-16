/**
 * Equipo de producción — campo Productor en eventos.
 */
export const PRODUCTORES_EQUIPO = [
  "Ana López",
  "Bruno Méndez",
  "Carla Ruiz",
  "Diego Fernández",
  "Elena Soto",
  "Facundo Páez",
  "Gabriela Núñez",
  "Hernán Costa",
] as const;

export const PRODUCTORES_OPTIONS = PRODUCTORES_EQUIPO.map((name) => ({
  value: name,
  label: name,
}));
