"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

import { errorMessage } from "@/lib/api";
import { localInputsToIso, toDateInputValue, toTimeInputValue } from "@/lib/time";
import type { NewDiscussion } from "@/types";

interface AddDiscussionFormProps {
  onSubmit: (input: NewDiscussion) => Promise<void>;
}

const DEFAULT_FOLLOW_UP_TIME = "09:00";

/** A sensible default follow-up: the next full hour. */
function nextFullHour(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

export function AddDiscussionForm({ onSubmit }: AddDiscussionFormProps) {
  const [note, setNote] = useState("");
  const [withFollowUp, setWithFollowUp] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFollowUp(checked: boolean) {
    setWithFollowUp(checked);
    if (checked && !date) {
      const suggestion = nextFullHour();
      setDate(toDateInputValue(suggestion));
      setTime(toTimeInputValue(suggestion));
    }
  }

  async function submit() {
    const trimmed = note.trim();
    if (!trimmed) {
      setError("Write a note before saving.");
      return;
    }

    let followUpAt: string | null = null;
    if (withFollowUp) {
      if (!date) {
        setError("Pick a follow-up date.");
        return;
      }
      followUpAt = localInputsToIso(date, time || DEFAULT_FOLLOW_UP_TIME);
      if (Date.parse(followUpAt) <= Date.now()) {
        setError("The follow-up must be in the future.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ note: trimmed, follow_up_at: followUpAt });
      setNote("");
      setWithFollowUp(false);
      setDate("");
      setTime("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void submit();
    }
  }

  const fieldClass =
    "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <label htmlFor="new-discussion" className="sr-only">
        New discussion note
      </label>
      <textarea
        id="new-discussion"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        maxLength={5000}
        placeholder="Log a new discussion…"
        className="block w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={withFollowUp}
            onChange={(event) => toggleFollowUp(event.target.checked)}
            className="size-4 rounded border-slate-300 accent-blue-600"
          />
          Set Follow-up
        </label>
        <input
          type="date"
          aria-label="Follow-up date"
          value={date}
          min={toDateInputValue(new Date())}
          onChange={(event) => setDate(event.target.value)}
          disabled={!withFollowUp}
          className={fieldClass}
        />
        <input
          type="time"
          aria-label="Follow-up time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          disabled={!withFollowUp}
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={submitting}
          className="ml-auto rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save Note"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
