# LeadFlow

A lightweight, single-screen lead management tool (a mini CRM). A sales rep can track
their leads, log every discussion and set follow-up reminders, all from one page.

- **Frontend:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- **Backend:** FastAPI · SQLAlchemy 2 · Pydantic v2 · SQLite (Postgres-ready via `DATABASE_URL`)

## Features

**Lead list**
- Each lead shows its name, company, status badge, last discussion note and the time
  since that note.
- Today's follow-ups are pinned at the top, soonest due first.
- Overdue follow-ups are highlighted in red.
- Filter by status: New, Contacted, Qualified, Proposal Sent, Won, Lost.
- Search by name or company.

**Lead timeline dialog**
- Click any lead to open its full discussion history, newest first, in a dialog.
- Log a note with an optional follow-up date and time. The lead's follow-up updates,
  and the list reflects it immediately.
- Change the status from the dialog. The change is saved, and recorded in the timeline.
- Mark the current follow-up as done.

**Add new lead**
- Name is required; company and phone are optional. Status defaults to New.

**Also included**
- Docker Compose setup.
- Seed script with 7 leads and their discussion histories.
- API tests (pytest) and frontend unit tests (Vitest).
- Interactive API docs at `/docs`.

## Quick start (Docker)

```bash
docker compose up --build
```

| URL                          | What                               |
|------------------------------|------------------------------------|
| http://localhost:3000        | LeadFlow app                       |
| http://localhost:8000/docs   | API docs (Swagger UI)              |

The database lives in the `leadflow-data` volume. On first start, while the database
is empty, it is seeded with demo leads. To start over with fresh demo data, run
`docker compose down -v`.

## Local setup (without Docker)

Requirements: Python 3.11+ and Node.js 20.9+.

**1. Backend** (terminal 1)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed                 # optional demo data (7 leads)
uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Tests and checks

```bash
cd backend  && pytest                                          # 21 API tests
cd frontend && npm test && npm run lint && npm run typecheck   # 21 unit tests + lint + types
```

## Project structure

```
LeadFlow/
├── backend/                 # FastAPI service (see backend/README.md)
│   ├── app/
│   │   ├── main.py          # App, CORS, error handlers
│   │   ├── models.py        # Lead, Discussion
│   │   ├── schemas.py       # Request/response validation
│   │   ├── crud.py          # Queries and business rules
│   │   ├── routers/         # leads.py, discussions.py
│   │   └── seed.py          # Demo data
│   └── tests/
├── frontend/                # Next.js app (see frontend/README.md)
│   └── src/
│       ├── app/             # Layout and the single page
│       ├── components/      # Dashboard, list, cards, dialogs, form
│       ├── hooks/           # useLeads, useNow, useDebouncedValue
│       └── lib/             # API client, time and list logic
└── docker-compose.yml
```

## API overview

| Method | Path                           | Purpose                                     | Success |
|--------|--------------------------------|---------------------------------------------|---------|
| GET    | `/api/leads?status=&search=`   | List leads with last note                   | 200     |
| POST   | `/api/leads`                   | Create lead                                 | 201     |
| GET    | `/api/leads/{id}`              | Get lead                                    | 200     |
| PATCH  | `/api/leads/{id}`              | Update status / details / follow-up         | 200     |
| DELETE | `/api/leads/{id}`              | Delete lead                                 | 204     |
| GET    | `/api/leads/{id}/discussions`  | Timeline, newest first                      | 200     |
| POST   | `/api/leads/{id}/discussions`  | Log note (+ optional follow-up)             | 201     |

- **404** when the lead doesn't exist.
- **422** for invalid input.
- **500** for unexpected errors; the details are logged on the server, never sent to
  the client.

Errors always come back as `{"detail": ...}`. See [`backend/README.md`](backend/README.md)
for details and examples.

## Design decisions

- **Times are stored in UTC and judged in the rep's timezone.**
  - The API stores and returns UTC.
  - The browser decides what is "today" and "overdue", because only it knows the
    rep's timezone.
- **Overdue follow-ups stay pinned.**
  - A follow-up earlier today, or on a previous day, stays in the pinned section,
    marked overdue, until it's handled.
  - "Handled" means one of: a new follow-up is set, it's marked done, or the lead is
    Won or Lost.
- **Follow-ups only change when asked.**
  - A note logged *with* a follow-up updates the lead's follow-up.
  - A note logged *without* one leaves the existing follow-up alone.
- **The list never needs a reload.**
  - Saving a note returns both the new note and the updated lead.
  - The client merges that lead into the list directly.
- **The timeline records changes, the list shows conversations.**
  - The timeline includes "Lead created" and status changes, styled differently
    from notes.
  - The list's "Last Note" only shows notes the rep wrote.
- **No N+1 queries.** The list endpoint gets each lead's latest note with a single
  window-function query.
