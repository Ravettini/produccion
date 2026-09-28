import { useState } from "react";
import { cn } from "../../utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  /** Texto que se muestra al tocar el ? junto al label. */
  help?: string;
  options: { value: string; label: string }[];
}

function HelpButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Qué significa esto"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-700"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-0 top-7 z-20 w-64 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal leading-relaxed text-slate-600 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

export function Select({
  label,
  error,
  help,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
          {help && <HelpButton text={help} />}
        </div>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 border rounded-xl text-slate-900 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          "transition-colors duration-200",
          error ? "border-red-400" : "border-slate-200 hover:border-slate-300",
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
