import { cn } from "../../utils/cn";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

interface ChoiceCardsProps {
  options: ChoiceOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  columns?: 1 | 2;
}

export function ChoiceCards({
  options,
  value,
  onChange,
  multiple = false,
  columns = 1,
}: ChoiceCardsProps) {
  const selected = multiple ? (value as string[]) : [value as string].filter(Boolean);

  const toggle = (optValue: string) => {
    if (multiple) {
      const arr = value as string[];
      onChange(
        arr.includes(optValue) ? arr.filter((v) => v !== optValue) : [...arr, optValue]
      );
    } else {
      onChange(optValue);
    }
  };

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"
      )}
    >
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "text-left rounded-2xl border-2 p-4 sm:p-5 transition-all",
              active
                ? "border-brand-500 bg-brand-50 shadow-sm ring-2 ring-brand-200"
                : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/30"
            )}
          >
            <span className="font-semibold text-slate-900 block">{opt.label}</span>
            {opt.description && (
              <span className="text-sm text-slate-500 mt-1 block leading-snug">
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
