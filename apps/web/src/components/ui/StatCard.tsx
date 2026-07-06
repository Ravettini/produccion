import { cn } from "../../utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: "blue" | "amber" | "green" | "slate" | "red";
  className?: string;
}

const accentStyles = {
  blue: "bg-brand-50 text-brand-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-50 text-red-600",
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent = "blue",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-5 shadow-sm",
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl flex-shrink-0", accentStyles[accent])}>
            <Icon className="w-5 h-5" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
