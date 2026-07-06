import { cn } from "../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 border rounded-xl text-slate-900 placeholder-slate-400 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          "transition-colors duration-200",
          error ? "border-red-400" : "border-slate-200 hover:border-slate-300",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
