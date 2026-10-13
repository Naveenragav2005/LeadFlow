export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** All timestamps are ISO 8601 strings in UTC, e.g. "2026-10-13T14:00:00Z". */
export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_note: string | null;
  last_discussion_at: string | null;
}

export type DiscussionKind = "note" | "system";

export interface Discussion {
  id: number;
  lead_id: number;
  kind: DiscussionKind;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

export interface DiscussionCreated {
  discussion: Discussion;
  lead: Lead;
}

export interface LeadFilters {
  status: LeadStatus | null;
  search: string;
}

export interface NewLead {
  name: string;
  company?: string;
  phone?: string;
}

export interface LeadPatch {
  status?: LeadStatus;
  follow_up_at?: string | null;
}

export interface NewDiscussion {
  note: string;
  follow_up_at?: string | null;
}
