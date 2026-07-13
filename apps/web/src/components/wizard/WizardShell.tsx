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
}: WizardShellProps) {
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>
            Paso {stepIndex + 1} de {totalSteps}
            {stepLabel ? ` · ${stepLabel}` : ""}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-4 sm:py-8">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
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
