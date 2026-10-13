import { BellRing, CalendarClock, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";
import { describeFollowUp, followUpState } from "@/lib/time";

const STYLES = {
  overdue: { icon: TriangleAlert, className: "bg-red-100 text-red-700", prefix: "Overdue ·" },
  today: { icon: BellRing, className: "bg-blue-100 text-blue-700", prefix: "Follow-up" },
  upcoming: { icon: CalendarClock, className: "bg-slate-100 text-slate-600", prefix: "Follow-up" },
} as const;

export function FollowUpChip({ followUpAt, now }: { followUpAt: string; now: number }) {
  const style = STYLES[followUpState(followUpAt, now)];
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold", style.className)}>
      <Icon aria-hidden className="size-3.5" />
      {style.prefix} {describeFollowUp(followUpAt, now)}
    </span>
  );
}
