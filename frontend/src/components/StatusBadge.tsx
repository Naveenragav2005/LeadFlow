import { cn } from "@/lib/cn";
import { STATUS_META } from "@/lib/status";
import type { LeadStatus } from "@/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap uppercase ring-1 ring-inset",
        meta.badgeClass,
      )}
    >
      {meta.label}
    </span>
  );
}
