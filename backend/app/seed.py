"""Seed the database with demo leads and discussions.

Usage (from the backend/ directory):
    python -m app.seed          # seed only if the database has no leads
    python -m app.seed --reset  # drop all data and re-seed

All timestamps are relative to "now", so the demo always shows a follow-up due
later today, an overdue follow-up and an upcoming one.
"""

import argparse
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Discussion, DiscussionKind, Lead, LeadStatus, utcnow


@dataclass
class SeedNote:
    ago: timedelta
    note: str
    kind: DiscussionKind = DiscussionKind.NOTE
    follow_up_in: timedelta | None = None  # Relative to now, not to the note.


@dataclass
class SeedLead:
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    created_ago: timedelta
    notes: list[SeedNote] = field(default_factory=list)


def _demo_leads() -> list[SeedLead]:
    d, h = timedelta(days=1), timedelta(hours=1)
    return [
        SeedLead(
            "Sarah Connor", "Acme Corp", "555-0199", LeadStatus.PROPOSAL_SENT, 6 * d,
            [
                SeedNote(5 * d, "Initial discovery call. They need a CRM for 50 reps. Pain points "
                                "include dropping leads and no follow-up tracking."),
                SeedNote(3 * d, "Status changed: Qualified → Proposal Sent", DiscussionKind.SYSTEM),
                SeedNote(2 * d, "Sent pricing tier PDF. Said she would review with her boss.",
                         follow_up_in=2 * h),
            ],
        ),
        SeedLead(
            "Hank Scorpio", "Globex", "555-0142", LeadStatus.NEW, 3 * h,
            [SeedNote(2 * h, "Inbound lead from website contact form.")],
        ),
        SeedLead(
            "Bill Lumbergh", "Initech", "555-0117", LeadStatus.CONTACTED, 10 * d,
            [
                SeedNote(9 * d, "Cold email sent introducing LeadFlow."),
                SeedNote(7 * d, "Left a voicemail with his assistant.", follow_up_in=-2 * d),
            ],
        ),
        SeedLead(
            "Ellen Ripley", "Weyland-Yutani", "555-0180", LeadStatus.QUALIFIED, 14 * d,
            [
                SeedNote(12 * d, "Intro call. Budget approved for Q4, decision maker confirmed."),
                SeedNote(4 * d, "Demo went well. Wants a security questionnaire before the proposal.",
                         follow_up_in=-1 * d),
            ],
        ),
        SeedLead(
            "Diana Prince", "Themyscira Imports", None, LeadStatus.CONTACTED, 4 * d,
            [
                SeedNote(3 * d, "Met at the trade expo. Interested in the team plan."),
                SeedNote(1 * d, "Emailed case studies. Asked to reconnect after their board meeting.",
                         follow_up_in=3 * d),
            ],
        ),
        SeedLead(
            "Bruce Wayne", "Wayne Ent", "555-0100", LeadStatus.WON, 30 * d,
            [
                SeedNote(28 * d, "Referral from Lucius. Very interested in the enterprise plan."),
                SeedNote(25 * d, "Proposal sent with a 3-year discount."),
                SeedNote(21 * d, "Contract signed! Sending welcome package."),
            ],
        ),
        SeedLead(
            "Tony Stark", "Stark Industries", "555-0177", LeadStatus.LOST, 20 * d,
            [
                SeedNote(18 * d, "Demo call. Loved the UI, worried about the API limits."),
                SeedNote(15 * d, "Decided to build in-house. Revisit next year."),
            ],
        ),
    ]


def seed(db: Session) -> int:
    """Insert the demo leads. Returns the number of leads created."""
    now = utcnow()
    leads = _demo_leads()
    for item in leads:
        created_at = now - item.created_ago
        lead = Lead(
            name=item.name,
            company=item.company,
            phone=item.phone,
            status=item.status,
            created_at=created_at,
            updated_at=created_at,
        )
        lead.discussions.append(
            Discussion(kind=DiscussionKind.SYSTEM, note="Lead created.", created_at=created_at)
        )
        for note in item.notes:
            noted_at: datetime = now - note.ago
            follow_up_at = now + note.follow_up_in if note.follow_up_in is not None else None
            lead.discussions.append(
                Discussion(kind=note.kind, note=note.note, follow_up_at=follow_up_at, created_at=noted_at)
            )
            if follow_up_at is not None:
                lead.follow_up_at = follow_up_at
            lead.updated_at = noted_at
        db.add(lead)
    db.commit()
    return len(leads)


def seed_if_empty(db: Session) -> int:
    if db.scalar(select(func.count()).select_from(Lead)):
        return 0
    return seed(db)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LeadFlow with demo data.")
    parser.add_argument("--reset", action="store_true", help="drop all existing data before seeding")
    args = parser.parse_args()

    if args.reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        created = seed(db) if args.reset else seed_if_empty(db)

    if created:
        print(f"Seeded {created} leads with discussions.")
    else:
        print("Database already has leads; nothing seeded. Use --reset to start over.")


if __name__ == "__main__":
    main()
