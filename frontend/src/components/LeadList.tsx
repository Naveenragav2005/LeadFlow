import type { ReactNode } from "react";

import { LeadCard } from "@/components/LeadCard";
import { splitPinned } from "@/lib/leads";
import type { Lead } from "@/types";

interface LeadListProps {
  leads: Lead[];
  now: number;
  hasLoaded: boolean;
  isFiltered: boolean;
  onSelect: (lead: Lead) => void;
}

export function LeadList({ leads, now, hasLoaded, isFiltered, onSelect }: LeadListProps) {
  if (!hasLoaded) return <LoadingSkeleton />;

  const { pinned, others } = splitPinned(leads, now);
  const overdueCount = pinned.filter((lead) => Date.parse(lead.follow_up_at!) < now).length;

  return (
    <div className="space-y-8">
      <Section
        title="📌 Today's Follow-ups"
        aside={overdueCount > 0 && <span className="text-red-600">{overdueCount} overdue</span>}
      >
        {pinned.length > 0 ? (
          pinned.map((lead) => <LeadCard key={lead.id} lead={lead} now={now} pinned onSelect={onSelect} />)
        ) : (
          <EmptyState>Nothing due today. Nice work!</EmptyState>
        )}
      </Section>

      <Section title="All Leads">
        {others.length > 0 ? (
          others.map((lead) => <LeadCard key={lead.id} lead={lead} now={now} onSelect={onSelect} />)
        ) : (
          <EmptyState>
            {isFiltered
              ? pinned.length > 0
                ? "No other leads match your search or filter."
                : "No leads match your search or filter."
              : leads.length > 0
                ? "Every lead is in today's follow-ups."
                : "No leads yet. Add your first lead to get started."}
          </EmptyState>
        )}
      </Section>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {title}
        {aside}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading leads">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-[86px] animate-pulse rounded-lg border border-slate-200 bg-white" />
      ))}
    </div>
  );
}
