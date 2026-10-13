import { isClosed } from "@/lib/status";
import { followUpState } from "@/lib/time";
import type { Lead, LeadFilters } from "@/types";

/** When the lead last had activity: its latest note, or when it was created. */
export function lastActivityAt(lead: Lead): number {
  return Date.parse(lead.last_discussion_at ?? lead.created_at);
}

/** Most recent activity first. Mirrors the API's ordering so local updates stay consistent. */
export function sortByActivity(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => lastActivityAt(b) - lastActivityAt(a) || b.id - a.id);
}

export function matchesFilters(lead: Lead, filters: LeadFilters): boolean {
  if (filters.status && lead.status !== filters.status) return false;
  const term = filters.search.trim().toLowerCase();
  if (!term) return true;
  return lead.name.toLowerCase().includes(term) || (lead.company ?? "").toLowerCase().includes(term);
}

/**
 * Insert or replace a lead in the list after a create/update, without refetching.
 * The lead is dropped if it no longer matches the active filters.
 */
export function upsertLead(leads: Lead[], lead: Lead, filters: LeadFilters): Lead[] {
  const others = leads.filter((existing) => existing.id !== lead.id);
  return sortByActivity(matchesFilters(lead, filters) ? [...others, lead] : others);
}

/** Open leads whose follow-up is due today or already overdue. */
export function isPinned(lead: Lead, now: number): boolean {
  if (!lead.follow_up_at || isClosed(lead.status)) return false;
  return followUpState(lead.follow_up_at, now) !== "upcoming";
}

/** Split leads into the pinned follow-up section (soonest due first) and the rest. */
export function splitPinned(leads: Lead[], now: number): { pinned: Lead[]; others: Lead[] } {
  const pinned: Lead[] = [];
  const others: Lead[] = [];
  for (const lead of leads) {
    (isPinned(lead, now) ? pinned : others).push(lead);
  }
  pinned.sort((a, b) => Date.parse(a.follow_up_at!) - Date.parse(b.follow_up_at!));
  return { pinned, others };
}
