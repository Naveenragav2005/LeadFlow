"use client";

import { Check, Phone, RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AddDiscussionForm } from "@/components/AddDiscussionForm";
import { DiscussionTimeline } from "@/components/DiscussionTimeline";
import { FollowUpChip } from "@/components/FollowUpChip";
import { Dialog } from "@/components/ui/Dialog";
import { api, errorMessage, isAbortError } from "@/lib/api";
import { isClosed, STATUS_META } from "@/lib/status";
import { LEAD_STATUSES, type Discussion, type Lead, type LeadStatus, type NewDiscussion } from "@/types";

interface LeadTimelineDialogProps {
  lead: Lead;
  now: number;
  onClose: () => void;
  /** Called with the API's latest version of the lead after any change. */
  onLeadUpdated: (lead: Lead) => void;
}

export function LeadTimelineDialog({ lead, now, onClose, onLeadUpdated }: LeadTimelineDialogProps) {
  const [discussions, setDiscussions] = useState<Discussion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearingFollowUp, setClearingFollowUp] = useState(false);

  const [reloadCount, setReloadCount] = useState(0);
  const reloadDiscussions = () => setReloadCount((count) => count + 1);

  useEffect(() => {
    const controller = new AbortController();
    api
      .listDiscussions(lead.id, controller.signal)
      .then((items) => {
        setDiscussions(items);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setLoadError(errorMessage(error));
      });
    return () => controller.abort();
  }, [lead.id, reloadCount]);

  async function handleStatusChange(status: LeadStatus) {
    setPendingStatus(status);
    setActionError(null);
    try {
      onLeadUpdated(await api.updateLead(lead.id, { status }));
      // The API logs the change in the timeline; show it.
      reloadDiscussions();
    } catch (error) {
      setActionError(`Couldn't update status: ${errorMessage(error)}`);
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleClearFollowUp() {
    setClearingFollowUp(true);
    setActionError(null);
    try {
      onLeadUpdated(await api.updateLead(lead.id, { follow_up_at: null }));
    } catch (error) {
      setActionError(`Couldn't clear the follow-up: ${errorMessage(error)}`);
    } finally {
      setClearingFollowUp(false);
    }
  }

  async function handleAddDiscussion(input: NewDiscussion) {
    const { discussion, lead: updatedLead } = await api.addDiscussion(lead.id, input);
    setDiscussions((previous) => [discussion, ...(previous ?? [])]);
    onLeadUpdated(updatedLead);
  }

  const showFollowUp = lead.follow_up_at !== null && !isClosed(lead.status);

  return (
    <Dialog labelledBy="lead-dialog-title" onClose={onClose} className="max-w-2xl">
      <div className="flex max-h-[min(90vh,860px)] flex-col">
        <header className="flex flex-wrap items-start gap-3 border-b border-slate-200 px-4 py-4 sm:flex-nowrap sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id="lead-dialog-title" className="text-lg font-semibold break-words">
              {lead.name}
              {lead.company && <span className="ml-1.5 font-normal text-slate-500">({lead.company})</span>}
            </h2>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
              >
                <Phone aria-hidden className="size-3.5" />
                {lead.phone}
              </a>
            )}
          </div>

          {/* On phones the status picker drops to its own full-width row below the name. */}
          <div className="order-last w-full sm:order-none sm:w-auto sm:shrink-0">
            <label htmlFor="lead-status" className="sr-only">
              Status
            </label>
            <select
              id="lead-status"
              value={pendingStatus ?? lead.status}
              onChange={(event) => void handleStatusChange(event.target.value as LeadStatus)}
              disabled={pendingStatus !== null}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pr-8 pl-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-60"
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>

        {(showFollowUp || actionError) && (
          <div className="space-y-2 border-b border-slate-200 px-4 py-3 sm:px-6">
            {showFollowUp && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FollowUpChip followUpAt={lead.follow_up_at!} now={now} />
                <button
                  type="button"
                  onClick={() => void handleClearFollowUp()}
                  disabled={clearingFollowUp}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  <Check aria-hidden className="size-3.5" />
                  Mark follow-up done
                </button>
              </div>
            )}
            {actionError && (
              <p role="alert" className="text-sm text-red-600">
                {actionError}
              </p>
            )}
          </div>
        )}

        <div className="min-h-40 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
          {loadError ? (
            <div role="alert" className="flex flex-col items-center gap-3 py-6 text-sm text-red-600">
              {loadError}
              <button
                type="button"
                onClick={reloadDiscussions}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1 font-medium hover:bg-red-50"
              >
                <RotateCw aria-hidden className="size-3.5" />
                Retry
              </button>
            </div>
          ) : discussions === null ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading discussions…</p>
          ) : (
            <DiscussionTimeline discussions={discussions} now={now} />
          )}
        </div>

        <AddDiscussionForm onSubmit={handleAddDiscussion} />
      </div>
    </Dialog>
  );
}
