"use client";

import { useCallback, useEffect, useState } from "react";

import { api, errorMessage, isAbortError } from "@/lib/api";
import { upsertLead as upsertInList } from "@/lib/leads";
import type { Lead, LeadFilters, LeadStatus } from "@/types";

interface LeadsState {
  /** Which request these results belong to; used to derive the loading flag. */
  key: string;
  leads: Lead[];
  error: string | null;
}

/**
 * Loads leads for the given filters and keeps them up to date locally.
 * Mutations call `upsertLead` with the API's response so the list changes
 * immediately, without waiting for a refetch.
 */
export function useLeads(status: LeadStatus | null, search: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<LeadsState>({ key: "", leads: [], error: null });

  const requestKey = JSON.stringify([status, search, reloadCount]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .listLeads({ status, search }, controller.signal)
      .then((leads) => setState({ key: requestKey, leads, error: null }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        // Keep showing the previous results alongside the error.
        setState((previous) => ({ ...previous, key: requestKey, error: errorMessage(error) }));
      });
    return () => controller.abort();
  }, [status, search, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const upsertLead = useCallback(
    (lead: Lead) => {
      const filters: LeadFilters = { status, search };
      setState((previous) => ({ ...previous, leads: upsertInList(previous.leads, lead, filters) }));
    },
    [status, search],
  );

  return {
    leads: state.leads,
    error: state.error,
    isLoading: state.key !== requestKey,
    hasLoaded: state.key !== "",
    reload,
    upsertLead,
  };
}
