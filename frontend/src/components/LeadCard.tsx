import { FollowUpChip } from "@/components/FollowUpChip";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/cn";
import { isClosed } from "@/lib/status";
import { followUpState, timeAgo } from "@/lib/time";
import type { Lead } from "@/types";

interface LeadCardProps {
  lead: Lead;
  now: number;
  pinned?: boolean;
  onSelect: (lead: Lead) => void;
}

export function LeadCard({ lead, now, pinned = false, onSelect }: LeadCardProps) {
  const closed = isClosed(lead.status);
  const showFollowUp = lead.follow_up_at !== null && !closed;
  const overdue = showFollowUp && followUpState(lead.follow_up_at!, now) === "overdue";

  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className={cn(
        "block w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        overdue
          ? "border-red-300 bg-red-50/70 hover:border-red-400"
          : pinned
            ? "border-blue-200 bg-blue-50/70 hover:border-blue-300"
            : "border-slate-200 hover:border-slate-300",
        closed && "opacity-60 hover:opacity-100",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate">
          <span className="text-base font-semibold text-slate-900">{lead.name}</span>
          {lead.company && <span className="ml-1.5 text-sm text-slate-500">({lead.company})</span>}
        </p>
        <StatusBadge status={lead.status} />
      </div>

      <div className="mt-2 flex items-baseline gap-2 text-sm">
        <p className="min-w-0 truncate text-slate-600">
          <span className="font-semibold text-slate-700">Last Note:</span>{" "}
          {lead.last_note ?? <span className="text-slate-400 italic">No discussions yet</span>}
        </p>
        <span className="shrink-0 text-xs text-slate-400">
          {lead.last_discussion_at ? timeAgo(lead.last_discussion_at, now) : `added ${timeAgo(lead.created_at, now)}`}
        </span>
      </div>

      {showFollowUp && (
        <div className="mt-3">
          <FollowUpChip followUpAt={lead.follow_up_at!} now={now} />
        </div>
      )}
    </button>
  );
}
