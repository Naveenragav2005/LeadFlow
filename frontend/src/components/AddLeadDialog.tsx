"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { api, errorMessage } from "@/lib/api";
import type { Lead } from "@/types";

interface AddLeadDialogProps {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

const inputClass =
  "mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none";

export function AddLeadDialog({ onClose, onCreated }: AddLeadDialogProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const lead = await api.createLead({
        name: name.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onCreated(lead);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Dialog labelledBy="add-lead-title" onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="add-lead-title" className="text-lg font-semibold">
            Add New Lead
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block text-sm font-medium text-slate-700">
            Full Name <span className="text-red-500">*</span>
            <input
              autoFocus
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., John Doe"
              aria-invalid={error !== null && !name.trim()}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Company <span className="font-normal text-slate-400">(Optional)</span>
            <input
              maxLength={120}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="e.g., Stark Industries"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone <span className="font-normal text-slate-400">(Optional)</span>
            <input
              type="tel"
              maxLength={40}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g., 555-0123"
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save Lead"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
