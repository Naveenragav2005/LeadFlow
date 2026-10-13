import { CalendarClock } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatDateTime, timeAgo } from "@/lib/time";
import type { Discussion } from "@/types";

interface DiscussionTimelineProps {
  discussions: Discussion[];
  now: number;
}

/** Discussion history, newest first, as a vertical timeline. */
export function DiscussionTimeline({ discussions, now }: DiscussionTimelineProps) {
  if (discussions.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No discussions yet.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
      {discussions.map((discussion, index) => {
        const isSystem = discussion.kind === "system";
        return (
          <li key={discussion.id} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute top-1 -left-[31px] size-3 rounded-full ring-4 ring-slate-50",
                index === 0 ? "bg-blue-500" : "bg-slate-300",
              )}
            />
            <p className="mb-1.5 text-xs text-slate-500">
              <time dateTime={discussion.created_at}>{formatDateTime(discussion.created_at, now)}</time>
              <span className="ml-1.5 text-slate-400">({timeAgo(discussion.created_at, now)})</span>
            </p>
            <div
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                isSystem ? "border-slate-200 bg-slate-100/70 text-slate-500 italic" : "border-slate-200 bg-white text-slate-800 shadow-sm",
              )}
            >
              <p className="whitespace-pre-wrap">{discussion.note}</p>
              {discussion.follow_up_at && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 not-italic">
                  <CalendarClock aria-hidden className="size-3.5" />
                  Follow-up set for: {formatDateTime(discussion.follow_up_at, now)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
