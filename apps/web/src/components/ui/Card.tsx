import { cn } from "../../utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",
        hover && "hover:shadow-md hover:border-slate-300 transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  action,
  subtitle,
}: CardProps & { action?: React.ReactNode; subtitle?: string }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div>
        <div className="font-semibold text-slate-900">{children}</div>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex gap-2 justify-end flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}
