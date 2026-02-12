import { cn } from "../../utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
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
}: CardProps & { action?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "px-3 sm:px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2",
        className
      )}
    >
      <div className="font-semibold text-slate-800">{children}</div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn("p-3 sm:p-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex gap-2 justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
