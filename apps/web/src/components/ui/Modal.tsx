import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface ModalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  footer?: React.ReactNode;
}

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  open,
  size = "md",
  footer,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-3xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] my-auto animate-fade-in",
          "rounded-b-none sm:rounded-b-2xl",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <div className="min-w-0 pr-2">
            <h2 id="modal-title" className="font-semibold text-base sm:text-lg text-slate-900 break-words">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5 break-words">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 stack-actions sm:justify-end [&_button]:w-full [&_button]:sm:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
