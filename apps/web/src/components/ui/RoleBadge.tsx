import { Badge } from "./Badge";
import { roleLabels, roleColors } from "../../utils/labels";
import type { Role } from "../../types";
import { cn } from "../../utils/cn";

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const label = roleLabels[role as Role] ?? role;
  const color = roleColors[role as Role] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return <Badge className={cn(color, className)}>{label}</Badge>;
}
