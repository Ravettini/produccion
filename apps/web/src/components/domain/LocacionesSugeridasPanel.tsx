import type { LocacionSugerida } from "../../config/locaciones2026.types";
import { cn } from "../../utils/cn";

interface LocacionesSugeridasPanelProps {
  sugerencias: LocacionSugerida[];
  seleccionado: string;
  onSeleccionar: (value: string) => void;
  maxVisible?: number;
}

export function LocacionesSugeridasPanel({
  sugerencias,
  seleccionado,
  onSeleccionar,
  maxVisible = 12,
}: LocacionesSugeridasPanelProps) {
  const visibles = sugerencias.slice(0, maxVisible);
  const restantes = Math.max(0, sugerencias.length - visibles.length);

  if (visibles.length === 0) {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-4">
        No hay locaciones que cumplan los filtros. Probá relajar algún requisito o cambiar la cantidad de personas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {visibles.map((loc) => {
          const activo = seleccionado === loc.value;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSeleccionar(loc.value)}
              className={cn(
                "text-left rounded-xl border p-3 transition-colors",
                activo
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
              )}
            >
              <p className="font-medium text-sm text-slate-900 leading-snug">
                {loc.sede} — {loc.nombre}
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate">{loc.ubicacion}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {loc.capacidad != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    hasta {loc.capacidad} pers.
                  </span>
                )}
                {loc.wifi && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">WiFi</span>
                )}
                {loc.tecnica && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Técnica</span>
                )}
                {loc.accesibilidad && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">Accesible</span>
                )}
                {loc.estacionamiento === true && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Estacionamiento</span>
                )}
              </div>
              {loc.advertencias[0] && (
                <p className="text-[10px] text-amber-700 mt-1.5 line-clamp-2">{loc.advertencias[0]}</p>
              )}
            </button>
          );
        })}
      </div>
      {restantes > 0 && (
        <p className="text-xs text-slate-500">
          + {restantes} más en el buscador de abajo
        </p>
      )}
    </div>
  );
}
