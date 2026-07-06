import { Badge } from "./Badge";
import { cn } from "../../utils/cn";
import {
  eventStatusLabels,
  eventStatusColors,
  proposalStatusLabels,
  proposalStatusColors,
  impactLabels,
  impactColors,
} from "../../utils/labels";
import type { EventStatus, ProposalStatus, ProposalImpact } from "../../types";

type StatusKind = "event" | "proposal" | "impact";

interface StatusBadgeProps {
  kind: StatusKind;
  value: EventStatus | ProposalStatus | ProposalImpact | string;
  className?: string;
}

const maps = {
  event: { labels: eventStatusLabels, colors: eventStatusColors },
  proposal: { labels: proposalStatusLabels, colors: proposalStatusColors },
  impact: { labels: impactLabels, colors: impactColors },
} as const;

export function StatusBadge({ kind, value, className }: StatusBadgeProps) {
  const { labels, colors } = maps[kind];
  const label = (labels as Record<string, string>)[value] ?? value;
  const color = (colors as Record<string, string>)[value] ?? "bg-slate-100 text-slate-700";
  return <Badge className={cn(color, className)}>{label}</Badge>;
}
