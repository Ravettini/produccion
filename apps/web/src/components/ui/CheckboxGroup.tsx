import { cn } from "../../utils/cn";

export interface CheckboxOption {
  value: string;
  label: string;
  /** Tooltip al pasar el mouse (opcional) */
  title?: string;
}

interface CheckboxGroupProps {
  label?: string;
  options: CheckboxOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  required?: boolean;
}

export function CheckboxGroup({
  label,
  options,
  value,
  onChange,
  className,
  required,
}: CheckboxGroupProps) {
  const toggle = (optValue: string) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange(next);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      )}
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="w-4 h-4 rounded border-slate-300 text-gov-600 focus:ring-gov-500 cursor-pointer"
            />
            <span className="text-slate-700 group-hover:text-slate-900" title={(opt as { title?: string }).title}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
