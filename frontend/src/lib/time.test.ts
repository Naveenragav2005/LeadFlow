import { describe, expect, it } from "vitest";

import { describeFollowUp, followUpState, localInputsToIso, timeAgo } from "@/lib/time";

// Local-time constructors keep these tests independent of the machine's timezone.
const now = new Date(2026, 9, 13, 12, 0).getTime(); // Oct 13, 12:00 PM local
const at = (...args: [number, number, number, number, number]) => new Date(...args).toISOString();

describe("timeAgo", () => {
  it.each([
    [now - 20_000, "just now"],
    [now - 5 * 60_000, "5 minutes ago"],
    [now - 2 * 3_600_000, "2 hours ago"],
    [now - 2 * 86_400_000, "2 days ago"],
    [now - 7 * 86_400_000, "1 week ago"],
    [now - 21 * 86_400_000, "3 weeks ago"],
    [now - 90 * 86_400_000, "3 months ago"],
  ])("formats %s", (timestamp, expected) => {
    expect(timeAgo(new Date(timestamp).toISOString(), now)).toBe(expected);
  });

  it("treats future timestamps as just now", () => {
    expect(timeAgo(new Date(now + 60_000).toISOString(), now)).toBe("just now");
  });
});

describe("followUpState", () => {
  it("is overdue when the time has passed, even earlier today", () => {
    expect(followUpState(at(2026, 9, 13, 9, 0), now)).toBe("overdue");
    expect(followUpState(at(2026, 9, 11, 9, 0), now)).toBe("overdue");
  });

  it("is today when due later today", () => {
    expect(followUpState(at(2026, 9, 13, 23, 59), now)).toBe("today");
  });

  it("is upcoming from tomorrow on", () => {
    expect(followUpState(at(2026, 9, 14, 0, 0), now)).toBe("upcoming");
  });
});

describe("describeFollowUp", () => {
  it("uses today / tomorrow / yesterday when close", () => {
    expect(describeFollowUp(at(2026, 9, 13, 14, 0), now)).toBe("today at 2:00 PM");
    expect(describeFollowUp(at(2026, 9, 14, 9, 30), now)).toBe("tomorrow at 9:30 AM");
    expect(describeFollowUp(at(2026, 9, 12, 17, 0), now)).toBe("yesterday at 5:00 PM");
  });

  it("falls back to a date", () => {
    expect(describeFollowUp(at(2026, 9, 20, 14, 0), now)).toBe("Oct 20, 2:00 PM");
    expect(describeFollowUp(at(2027, 0, 5, 14, 0), now)).toBe("Jan 5, 2027, 2:00 PM");
  });
});

describe("localInputsToIso", () => {
  it("reads the inputs as local time", () => {
    expect(localInputsToIso("2026-10-13", "14:00")).toBe(at(2026, 9, 13, 14, 0));
  });
});
