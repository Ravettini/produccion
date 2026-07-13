import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import type { SearchableOption } from "./SearchableSelect";

interface MultiSearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSearchableSelect({
  label,
  placeholder = "Buscar o seleccionar…",
  options,
  value,
  onChange,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Ningún resultado",
  className,
  disabled,
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

  const toggle = (optValue: string) => {
    if (!optValue) return;
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
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
          <span className="text-slate-500 flex items-center justify-between">
            {placeholder}
            <span className="text-slate-400 text-xs">▼</span>
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedLabels.map((lab, i) => (
              <span
                key={value[i]}
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
            <span className="text-slate-400 text-xs ml-auto">▼</span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-gov-500"
              autoFocus
            />
          </div>
          <ul className="overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              filtered.map((opt) => {
                const active = value.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.value)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gov-50 flex items-center gap-2",
                        active && "bg-gov-100 text-gov-800"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center text-[10px]",
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
        </div>
      )}
    </div>
  );
}
