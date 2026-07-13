import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 sm:mb-8", className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-2xl break-words">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto sm:flex-shrink-0 [&_button]:w-full [&_button]:sm:w-auto [&_a]:w-full [&_a]:sm:w-auto [&_a_button]:w-full [&_a_button]:sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
