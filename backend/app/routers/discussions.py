from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/leads/{lead_id}/discussions", tags=["discussions"])

DB = Annotated[Session, Depends(get_db)]
NOT_FOUND = {status.HTTP_404_NOT_FOUND: {"model": schemas.ErrorResponse}}


@router.get("", response_model=list[schemas.DiscussionOut], responses=NOT_FOUND)
def list_discussions(lead_id: int, db: DB) -> list[schemas.DiscussionOut]:
    """Full discussion history for a lead, newest first."""
    return crud.list_discussions(db, lead_id)


@router.post(
    "",
    response_model=schemas.DiscussionCreated,
    status_code=status.HTTP_201_CREATED,
    responses=NOT_FOUND,
)
def add_discussion(lead_id: int, payload: schemas.DiscussionCreate, db: DB) -> schemas.DiscussionCreated:
    """Log a discussion. If it includes a follow-up, the lead's follow-up is updated too."""
    return crud.add_discussion(db, lead_id, payload)
