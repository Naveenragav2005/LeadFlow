import type { LeadStatus } from "@/types";

interface StatusMeta {
  label: string;
  /** Tailwind classes for the status badge. */
  badgeClass: string;
}

export const STATUS_META: Record<LeadStatus, StatusMeta> = {
  new: { label: "New", badgeClass: "bg-green-50 text-green-700 ring-green-600/25" },
  contacted: { label: "Contacted", badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/25" },
  qualified: { label: "Qualified", badgeClass: "bg-sky-50 text-sky-700 ring-sky-600/25" },
  proposal_sent: { label: "Proposal Sent", badgeClass: "bg-purple-50 text-purple-700 ring-purple-600/25" },
  won: { label: "Won", badgeClass: "bg-slate-100 text-slate-600 ring-slate-500/25" },
  lost: { label: "Lost", badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

/** Won and lost leads are closed: no follow-ups to chase, shown dimmed. */
export function isClosed(status: LeadStatus): boolean {
  return status === "won" || status === "lost";
}
