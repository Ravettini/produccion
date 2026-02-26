import { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

export interface SearchableOption {
  value: string;
  label: string;
  codigo?: string;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  label,
  placeholder = "Buscar o seleccionar…",
  options,
  value,
  onChange,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Ningún resultado",
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayValue = selected ? (selected.codigo ? `${selected.codigo} - ${selected.label}` : selected.label) : value || "";

  const filtered = options.filter((o) => {
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
          "w-full px-3 py-2 border rounded-lg text-left text-slate-800 bg-white flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500",
          "border-slate-300 hover:border-slate-400",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className={!value ? "text-slate-500" : ""}>
          {value ? displayValue : placeholder}
        </span>
        <span className="text-slate-400 text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-60 flex flex-col">
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
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-gov-50",
                      opt.value === value && "bg-gov-100 text-gov-800"
                    )}
                  >
                    {opt.codigo ? (
                      <span><span className="text-slate-500 font-mono text-xs">{opt.codigo}</span> — {opt.label}</span>
                    ) : (
                      opt.label
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
