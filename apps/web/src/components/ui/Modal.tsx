import { useEffect } from "react";
import { cn } from "../../utils/cn";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ title, children, onClose, open, size = "md" }: ModalProps) {
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
    sm: "max-w-sm w-full",
    md: "max-w-md w-full",
    lg: "max-w-lg w-full",
    xl: "max-w-2xl w-full",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          "w-full bg-white rounded-xl shadow-xl flex flex-col max-h-[95vh] sm:max-h-[90vh] my-auto",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <h2 id="modal-title" className="font-semibold text-slate-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-xl leading-none p-1 rounded focus:outline-none focus:ring-2 focus:ring-gov-500"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">{children}</div>
      </div>
    </div>
  );
}
