import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import type { SearchableOption } from "./SearchableSelect";

interface MultiSearchableSelectProps {
  label?: string;
  hint?: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  /** Máximo de ítems seleccionables. */
  max?: number;
}

export function MultiSearchableSelect({
  label,
  hint,
  placeholder = "Buscar o seleccionar…",
  options,
  value,
  onChange,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Ningún resultado",
  className,
  disabled,
  max,
}: MultiSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .filter(Boolean);

  const filtered = options.filter((o) => {
    if (!o.value) return false;
    const text = (o.codigo ? `${o.codigo} ${o.label}` : o.label).toLowerCase();
    return text.includes(search.toLowerCase().trim());
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const atMax = max != null && value.length >= max;

  const toggle = (optValue: string) => {
    if (!optValue) return;
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else if (!atMax) {
      onChange([...value, optValue]);
    }
  };

  const remove = (optValue: string) => {
    onChange(value.filter((v) => v !== optValue));
  };

  return (
    <div ref={containerRef} className={cn("w-full relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      )}
      {hint && <p className="text-xs text-slate-500 mb-1.5">{hint}</p>}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[42px] px-3 py-2 border rounded-lg text-left text-slate-800 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500",
          "border-slate-300 hover:border-slate-400",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {value.length === 0 ? (
          <span className="text-slate-500 flex items-center justify-between gap-2">
            <span>{placeholder}</span>
            <span className="text-slate-400 text-xs shrink-0">varios · ▼</span>
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedLabels.map((lab, i) => (
              <span
                key={`${value[i]}-${i}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 text-xs font-medium"
              >
                {lab}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(value[i]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(value[i]);
                    }
                  }}
                  className="hover:text-brand-950"
                  aria-label={`Quitar ${lab}`}
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
            <span className="text-slate-400 text-xs ml-auto shrink-0">
              {value.length} seleccionado{value.length !== 1 ? "s" : ""} · ▼
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-60 flex flex-col">
          <div className="px-3 py-1.5 text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
            {max != null
              ? `Podés marcar hasta ${max}. El menú no se cierra al elegir.`
              : "Podés marcar varios. El menú no se cierra al elegir."}
            {atMax ? " Límite alcanzado." : ""}
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-gov-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              filtered.map((opt) => {
                const active = value.includes(opt.value);
                const blocked = atMax && !active;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(opt.value);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gov-50 flex items-center gap-2",
                        active && "bg-gov-100 text-gov-800",
                        blocked && "opacity-40 cursor-not-allowed hover:bg-white"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0",
                          active ? "bg-brand-600 border-brand-600 text-white" : "border-slate-300"
                        )}
                      >
                        {active ? "✓" : ""}
                      </span>
                      {opt.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="p-2 border-t border-slate-100">
            <button
              type="button"
              className="w-full text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-lg py-1.5"
              onClick={() => setOpen(false)}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
