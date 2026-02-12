import { cn } from "../../utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-slate-800 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-gov-500 focus:border-gov-500",
          error ? "border-red-400" : "border-slate-300",
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
