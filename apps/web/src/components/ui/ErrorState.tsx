import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Error al cargar",
  message = "Ocurrió un error. Revisá que la API esté en marcha.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
      <p className="font-medium text-red-800">{title}</p>
      <p className="text-sm text-red-700 mt-1">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
