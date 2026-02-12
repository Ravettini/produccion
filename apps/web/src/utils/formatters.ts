/** Formato de fecha para UI */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formato de fecha corto */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
