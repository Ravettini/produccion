import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";

interface WizardShellProps {
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  stepLabel?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  canNext?: boolean;
  isLast?: boolean;
  isPending?: boolean;
  nextLabel?: string;
  finishLabel?: string;
  error?: string;
  eyebrow?: string;
}

function isFocusableField(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "SELECT") return true;
  if (tag === "BUTTON") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return !["hidden", "submit", "button", "reset", "file"].includes(type);
  }
  if (el.isContentEditable) return true;
  return el.tabIndex >= 0;
}

function focusablesIn(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll(
    "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])"
  );
  return Array.from(nodes).filter(isFocusableField);
}

export function WizardShell({
  title,
  subtitle,
  stepIndex,
  totalSteps,
  stepLabel,
  children,
  onBack,
  onNext,
  onFinish,
  canNext = true,
  isLast = false,
  isPending = false,
  nextLabel = "Siguiente",
  finishLabel = "Guardar evento",
  error,
  eyebrow = "Nuevo evento",
}: WizardShellProps) {
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // En textarea, Enter inserta salto de línea (salvo que quieran avanzar con Ctrl+Enter — no aplica).
    if (target.tagName === "TEXTAREA") return;
    // Botones: dejar el comportamiento nativo (click).
    if (target.tagName === "BUTTON" || target.getAttribute("role") === "button") return;

    e.preventDefault();
    const root = e.currentTarget;
    const fields = focusablesIn(root).filter(
      (el) => el.tagName !== "BUTTON" && el.getAttribute("role") !== "button"
    );
    const idx = fields.indexOf(target);
    if (idx >= 0 && idx < fields.length - 1) {
      fields[idx + 1]?.focus();
      return;
    }
    // Último campo del paso → avanzar / guardar
    if (!canNext || isPending) return;
    if (isLast) onFinish?.();
    else onNext?.();
  };

  return (
    <div className="min-h-full flex flex-col w-full" onKeyDown={handleKeyDown}>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-slate-600 mb-3">
          <span>
            Paso {stepIndex + 1} de {totalSteps}
            {stepLabel ? (
              <span className="text-slate-400 font-normal"> · {stepLabel}</span>
            ) : null}
          </span>
          <span className="tabular-nums text-brand-700">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-6 sm:py-10">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-3">
            {eyebrow}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-lg mx-auto text-balance">
              {subtitle}
            </p>
          )}
        </div>

        <div className="w-full max-w-xl mx-auto">{children}</div>

        {error && (
          <p className="text-red-600 text-sm text-center mt-6" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 pt-4 pb-2 bg-surface border-t border-slate-200/80 mt-6">
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={!onBack || isPending}
            className={cn("w-full sm:w-auto", !onBack && "invisible")}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Atrás
          </Button>
          {isLast ? (
            <Button
              type="button"
              onClick={onFinish}
              disabled={!canNext || isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? "Guardando…" : finishLabel}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={!canNext || isPending}
              className="w-full sm:w-auto"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
