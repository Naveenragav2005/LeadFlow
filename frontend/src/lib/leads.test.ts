import { describe, expect, it } from "vitest";

import { isPinned, matchesFilters, sortByActivity, splitPinned, upsertLead } from "@/lib/leads";
import type { Lead, LeadFilters } from "@/types";

const now = new Date(2026, 9, 13, 12, 0).getTime();
const hoursFromNow = (hours: number) => new Date(now + hours * 3_600_000).toISOString();

function makeLead(overrides: Partial<Lead> & { id: number }): Lead {
  return {
    name: `Lead ${overrides.id}`,
    company: null,
    phone: null,
    status: "new",
    follow_up_at: null,
    created_at: hoursFromNow(-100),
    updated_at: hoursFromNow(-100),
    last_note: null,
    last_discussion_at: null,
    ...overrides,
  };
}

const noFilters: LeadFilters = { status: null, search: "" };

describe("isPinned", () => {
  it("pins open leads with a follow-up due later today", () => {
    expect(isPinned(makeLead({ id: 1, follow_up_at: hoursFromNow(2) }), now)).toBe(true);
  });

  it("pins overdue follow-ups", () => {
    expect(isPinned(makeLead({ id: 1, follow_up_at: hoursFromNow(-48) }), now)).toBe(true);
  });

  it("does not pin future days, leads without follow-up, or closed leads", () => {
    expect(isPinned(makeLead({ id: 1, follow_up_at: hoursFromNow(48) }), now)).toBe(false);
    expect(isPinned(makeLead({ id: 2 }), now)).toBe(false);
    expect(isPinned(makeLead({ id: 3, status: "won", follow_up_at: hoursFromNow(1) }), now)).toBe(false);
  });
});

describe("splitPinned", () => {
  it("puts the most overdue follow-up first and keeps the rest in order", () => {
    const leads = [
      makeLead({ id: 1 }),
      makeLead({ id: 2, follow_up_at: hoursFromNow(2) }),
      makeLead({ id: 3, follow_up_at: hoursFromNow(-30) }),
      makeLead({ id: 4, follow_up_at: hoursFromNow(72) }),
    ];
    const { pinned, others } = splitPinned(leads, now);
    expect(pinned.map((lead) => lead.id)).toEqual([3, 2]);
    expect(others.map((lead) => lead.id)).toEqual([1, 4]);
  });
});

describe("matchesFilters", () => {
  const lead = makeLead({ id: 1, name: "Bill Lumbergh", company: "Initech", status: "contacted" });

  it("matches status and case-insensitive name or company", () => {
    expect(matchesFilters(lead, noFilters)).toBe(true);
    expect(matchesFilters(lead, { status: "contacted", search: "BILL" })).toBe(true);
    expect(matchesFilters(lead, { status: null, search: "initech" })).toBe(true);
    expect(matchesFilters(lead, { status: "won", search: "" })).toBe(false);
    expect(matchesFilters(lead, { status: null, search: "wayne" })).toBe(false);
  });
});

describe("upsertLead", () => {
  it("replaces an updated lead and re-sorts by latest activity", () => {
    const leads = sortByActivity([
      makeLead({ id: 1, last_discussion_at: hoursFromNow(-5) }),
      makeLead({ id: 2, last_discussion_at: hoursFromNow(-1) }),
    ]);
    const updated = makeLead({ id: 1, last_note: "New note", last_discussion_at: hoursFromNow(0) });

    const result = upsertLead(leads, updated, noFilters);

    expect(result.map((lead) => lead.id)).toEqual([1, 2]);
    expect(result[0].last_note).toBe("New note");
  });

  it("adds new leads and drops leads that no longer match the filters", () => {
    const filters: LeadFilters = { status: "new", search: "" };
    const leads = [makeLead({ id: 1 })];

    expect(upsertLead(leads, makeLead({ id: 2, created_at: hoursFromNow(0) }), filters)).toHaveLength(2);
    expect(upsertLead(leads, makeLead({ id: 1, status: "won" }), filters)).toHaveLength(0);
  });
});
