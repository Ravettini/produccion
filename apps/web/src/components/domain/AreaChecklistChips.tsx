import type { AreaChecklistItem } from "../../types";
import { cn } from "../../utils/cn";

interface AreaChecklistChipsProps {
  items?: AreaChecklistItem[];
  /** Área del usuario, para resaltar la que le toca decidir. */
  highlightAreaRole?: string | null;
  size?: "sm" | "md";
  className?: string;
}

const ESTADO_LABEL: Record<string, string> = {
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PENDING: "Pendiente",
};

const ESTADO_ICON: Record<string, string> = {
  APPROVED: "✓",
  REJECTED: "✕",
  PENDING: "○",
};

const ESTADO_COLOR: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-800 ring-red-200",
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
};

/** Check compacto de las áreas involucradas y su aprobación. */
export function AreaChecklistChips({
  items,
  highlightAreaRole,
  size = "md",
  className,
}: AreaChecklistChipsProps) {
  if (!items || items.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item) => {
        const estado = ESTADO_LABEL[item.estado] ? item.estado : "PENDING";
        const detalle =
          estado === "PENDING"
            ? "Sin decidir"
            : [item.decidedBy ? `por ${item.decidedBy}` : null, item.reason]
                .filter(Boolean)
                .join(" · ");
        return (
          <li key={item.areaRole}>
            <span
              title={`${item.label}: ${ESTADO_LABEL[estado]}${detalle ? ` (${detalle})` : ""}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg ring-1 font-medium",
                ESTADO_COLOR[estado],
                size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
                highlightAreaRole && item.areaRole === highlightAreaRole && "ring-2"
              )}
            >
              <span aria-hidden>{ESTADO_ICON[estado]}</span>
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
