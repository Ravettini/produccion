import { Link } from "react-router-dom";
import type { Proposal, ProposalCategory, ProposalImpact, ProposalStatus } from "../../types";
import { Badge } from "../ui/Badge";
import { StatusBadge } from "../ui/StatusBadge";
import { categoryLabels, categoryColors } from "../../utils/labels";
import { cn } from "../../utils/cn";

interface ProposalCardProps {
  proposal: Proposal;
  variant?: "default" | "compact" | "kanban";
  accent?: "green" | "amber" | "red" | "neutral";
  className?: string;
}

const accentBorder = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-400",
  red: "border-l-red-500",
  neutral: "border-l-slate-300",
};

export function ProposalCard({
  proposal,
  variant = "default",
  accent = "neutral",
  className,
}: ProposalCardProps) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <Badge className={categoryColors[proposal.categoria as ProposalCategory]}>
          {categoryLabels[proposal.categoria as ProposalCategory]}
        </Badge>
        <StatusBadge kind="impact" value={proposal.impacto as ProposalImpact} />
        {variant !== "kanban" && (
          <StatusBadge kind="proposal" value={proposal.estado as ProposalStatus} />
        )}
      </div>
      <p className="font-medium text-slate-900 hover:text-brand-700 transition-colors">{proposal.titulo}</p>
      {variant !== "compact" && (
        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{proposal.descripcion}</p>
      )}
      {proposal.createdBy && variant === "default" && (
        <p className="text-xs text-slate-500 mt-2">Por {proposal.createdBy.name}</p>
      )}
      {proposal.decisionReason && accent === "red" && (
        <p className="text-sm text-red-700 mt-2 italic">Motivo: {proposal.decisionReason}</p>
      )}
    </>
  );

  if (variant === "kanban") {
    return (
      <Link
        to={`/proposals/${proposal.id}`}
        className={cn("proposal-mini-card border-l-4", accentBorder[accent], className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      to={`/proposals/${proposal.id}`}
      className={cn(
        "block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-md transition-all",
        className
      )}
    >
      {content}
    </Link>
  );
}
