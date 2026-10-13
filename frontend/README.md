# LeadFlow web app (frontend)

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.

## Run locally

Requires Node.js 20.9+ and the backend running on http://localhost:8000 (see `../backend`).

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

To point at a different API, copy `.env.example` to `.env.local` and set
`NEXT_PUBLIC_API_URL`.

## Scripts

| Command             | What it does                        |
|---------------------|-------------------------------------|
| `npm run dev`       | Development server with hot reload  |
| `npm run build`     | Production build (standalone output) |
| `npm start`         | Serve the production build          |
| `npm run lint`      | ESLint (Next.js core-web-vitals rules) |
| `npm run typecheck` | TypeScript, no emit                 |
| `npm test`          | Vitest unit tests                   |

## Structure

```
src/
├── app/
│   ├── layout.tsx               # HTML shell, metadata, global styles
│   ├── page.tsx                 # The single screen
│   └── globals.css
├── components/
│   ├── LeadsDashboard.tsx       # Page state: filters, selected lead, dialogs
│   ├── Header.tsx               # Logo + "Add New Lead"
│   ├── Toolbar.tsx              # Search box + status filter chips
│   ├── LeadList.tsx             # Pinned follow-ups + all leads, empty/loading states
│   ├── LeadCard.tsx             # One lead row
│   ├── StatusBadge.tsx
│   ├── FollowUpChip.tsx         # Overdue / today / upcoming follow-up label
│   ├── AddLeadDialog.tsx
│   ├── LeadTimelineDialog.tsx   # Lead header, status picker, timeline, note form
│   ├── DiscussionTimeline.tsx
│   ├── AddDiscussionForm.tsx
│   └── ui/Dialog.tsx            # Reusable modal on the native <dialog> element
├── hooks/
│   ├── useLeads.ts              # Fetch leads for the filters + apply local updates
│   ├── useNow.ts                # Ticking clock for relative times
│   └── useDebouncedValue.ts
├── lib/
│   ├── api.ts                   # Typed API client and error handling
│   ├── leads.ts                 # Pinning, filtering, sorting, upsert (unit tested)
│   ├── time.ts                  # Relative time, "today"/"overdue" in local time (unit tested)
│   ├── status.ts                # Status labels and badge colours
│   └── cn.ts
└── types.ts                     # API types
```

## How the list stays in sync

- **Fetching:** the list is fetched for the current status filter and the debounced
  search term.
- **Mutations update the list straight away:**
  - Adding a lead, logging a note and changing status each return the updated lead
    from the API.
  - That lead is merged into the list right away (`upsertLead`) and re-sorted. The
    page never refetches or reloads.
  - If the change means the lead no longer matches the active filter, it drops out
    of the list.
- **Times are judged in the rep's timezone:** the API returns UTC, and the browser
  decides what counts as "today" and "overdue".
- **The clock ticks:** a timer re-renders once a minute, so "5 minutes ago" and the
  overdue highlighting stay correct while the page is left open.
