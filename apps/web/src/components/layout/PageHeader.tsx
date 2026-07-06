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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
