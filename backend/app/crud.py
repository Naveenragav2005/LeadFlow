"""Database queries and business rules. Routers stay thin and call into here."""

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session

from app import schemas
from app.models import Discussion, DiscussionKind, Lead, LeadStatus, utcnow

STATUS_LABELS = {
    LeadStatus.NEW: "New",
    LeadStatus.CONTACTED: "Contacted",
    LeadStatus.QUALIFIED: "Qualified",
    LeadStatus.PROPOSAL_SENT: "Proposal Sent",
    LeadStatus.WON: "Won",
    LeadStatus.LOST: "Lost",
}


class LeadNotFoundError(Exception):
    def __init__(self, lead_id: int) -> None:
        super().__init__(f"Lead {lead_id} not found")
        self.lead_id = lead_id


# ---------- Leads ----------


def _leads_with_last_note() -> Select:
    """Select each lead together with its most recent rep-written note.

    A window function picks the latest note per lead in a single query, so the
    list endpoint does not run one extra query per lead.
    """
    ranked = (
        select(
            Discussion.lead_id,
            Discussion.note,
            Discussion.created_at,
            func.row_number()
            .over(
                partition_by=Discussion.lead_id,
                order_by=(Discussion.created_at.desc(), Discussion.id.desc()),
            )
            .label("rn"),
        )
        .where(Discussion.kind == DiscussionKind.NOTE)
        .subquery()
    )
    return (
        select(Lead, ranked.c.note, ranked.c.created_at)
        .outerjoin(ranked, and_(ranked.c.lead_id == Lead.id, ranked.c.rn == 1))
        .order_by(func.coalesce(ranked.c.created_at, Lead.created_at).desc(), Lead.id.desc())
    )


def list_leads(db: Session, status: LeadStatus | None = None, search: str | None = None) -> list[schemas.LeadOut]:
    stmt = _leads_with_last_note()
    if status is not None:
        stmt = stmt.where(Lead.status == status)
    if search and search.strip():
        term = search.strip().lower()
        stmt = stmt.where(
            or_(
                func.lower(Lead.name).contains(term, autoescape=True),
                func.lower(Lead.company).contains(term, autoescape=True),
            )
        )
    return [schemas.LeadOut.from_row(*row) for row in db.execute(stmt).all()]


def get_lead(db: Session, lead_id: int) -> schemas.LeadOut:
    row = db.execute(_leads_with_last_note().where(Lead.id == lead_id)).first()
    if row is None:
        raise LeadNotFoundError(lead_id)
    return schemas.LeadOut.from_row(*row)


def _get_lead_model(db: Session, lead_id: int) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise LeadNotFoundError(lead_id)
    return lead


def create_lead(db: Session, data: schemas.LeadCreate) -> schemas.LeadOut:
    lead = Lead(**data.model_dump())
    lead.discussions.append(Discussion(kind=DiscussionKind.SYSTEM, note="Lead created."))
    db.add(lead)
    db.commit()
    return get_lead(db, lead.id)


def update_lead(db: Session, lead_id: int, data: schemas.LeadUpdate) -> schemas.LeadOut:
    lead = _get_lead_model(db, lead_id)
    changes = data.model_dump(exclude_unset=True)

    new_status = changes.get("status")
    if new_status is not None and new_status != lead.status:
        # Keep an audit trail of status changes in the timeline.
        lead.discussions.append(
            Discussion(
                kind=DiscussionKind.SYSTEM,
                note=f"Status changed: {STATUS_LABELS[lead.status]} → {STATUS_LABELS[new_status]}",
            )
        )

    for field, value in changes.items():
        setattr(lead, field, value)

    db.commit()
    return get_lead(db, lead_id)


def delete_lead(db: Session, lead_id: int) -> None:
    lead = _get_lead_model(db, lead_id)
    db.delete(lead)
    db.commit()


# ---------- Discussions ----------


def list_discussions(db: Session, lead_id: int) -> list[Discussion]:
    _get_lead_model(db, lead_id)
    stmt = (
        select(Discussion)
        .where(Discussion.lead_id == lead_id)
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
    )
    return list(db.scalars(stmt))


def add_discussion(db: Session, lead_id: int, data: schemas.DiscussionCreate) -> schemas.DiscussionCreated:
    lead = _get_lead_model(db, lead_id)
    discussion = Discussion(lead_id=lead.id, note=data.note, follow_up_at=data.follow_up_at)
    db.add(discussion)

    # A discussion that schedules a follow-up becomes the lead's next follow-up.
    # Without one, the lead's existing follow-up is left as it is.
    if data.follow_up_at is not None:
        lead.follow_up_at = data.follow_up_at
    # Touch the lead so updated_at reflects the latest activity.
    lead.updated_at = utcnow()

    db.commit()
    return schemas.DiscussionCreated(
        discussion=schemas.DiscussionOut.model_validate(discussion),
        lead=get_lead(db, lead_id),
    )
