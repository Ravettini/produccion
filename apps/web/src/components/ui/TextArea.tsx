import { cn } from "../../utils/cn";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
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
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
