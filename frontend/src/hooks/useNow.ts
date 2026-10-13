"use client";

import { useEffect, useState } from "react";

/**
 * The current time, refreshed periodically so "2 minutes ago", "today" and
 * "overdue" stay correct while the page is left open.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
