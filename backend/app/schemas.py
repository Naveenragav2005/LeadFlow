from datetime import datetime, timezone
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.models import DiscussionKind, Lead, LeadStatus

RequiredName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
OptionalText = Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=120)]
OptionalPhone = Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=40)]
NoteText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]


def _blank_to_none(value: str | None) -> str | None:
    return value or None


def _as_utc(value: datetime | None) -> datetime | None:
    """Treat naive datetimes as UTC and normalise everything to UTC."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


# ---------- Leads ----------


class LeadCreate(BaseModel):
    name: RequiredName
    company: OptionalText = None
    phone: OptionalPhone = None
    status: LeadStatus = LeadStatus.NEW

    _clean_optional = field_validator("company", "phone")(_blank_to_none)


class LeadUpdate(BaseModel):
    """Partial update: only the fields present in the request body are changed."""

    name: RequiredName | None = None
    company: OptionalText = None
    phone: OptionalPhone = None
    status: LeadStatus | None = None
    follow_up_at: datetime | None = None

    _clean_optional = field_validator("company", "phone")(_blank_to_none)
    _utc = field_validator("follow_up_at")(_as_utc)

    @field_validator("name", "status")
    @classmethod
    def not_null(cls, value: object) -> object:
        if value is None:
            raise ValueError("cannot be null")
        return value


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    follow_up_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_note: str | None = None
    last_discussion_at: datetime | None = None

    @classmethod
    def from_row(cls, lead: Lead, last_note: str | None, last_discussion_at: datetime | None) -> "LeadOut":
        out = cls.model_validate(lead)
        out.last_note = last_note
        out.last_discussion_at = last_discussion_at
        return out


# ---------- Discussions ----------


class DiscussionCreate(BaseModel):
    note: NoteText
    follow_up_at: datetime | None = Field(
        default=None,
        description="Optional follow-up date/time. When set, it also becomes the lead's follow-up.",
    )

    _utc = field_validator("follow_up_at")(_as_utc)


class DiscussionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    kind: DiscussionKind
    note: str
    follow_up_at: datetime | None
    created_at: datetime


class DiscussionCreated(BaseModel):
    """Returned after logging a discussion so the client can update the list without refetching."""

    discussion: DiscussionOut
    lead: LeadOut


# ---------- Errors ----------


class ErrorResponse(BaseModel):
    detail: str
