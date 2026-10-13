from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.models import LeadStatus

router = APIRouter(prefix="/api/leads", tags=["leads"])

DB = Annotated[Session, Depends(get_db)]
NOT_FOUND = {status.HTTP_404_NOT_FOUND: {"model": schemas.ErrorResponse}}


@router.get("", response_model=list[schemas.LeadOut])
def list_leads(
    db: DB,
    status_filter: Annotated[LeadStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query(max_length=100, description="Matches name or company")] = None,
) -> list[schemas.LeadOut]:
    """List leads, most recent activity first, each with its latest discussion note."""
    return crud.list_leads(db, status=status_filter, search=search)


@router.post("", response_model=schemas.LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(payload: schemas.LeadCreate, db: DB) -> schemas.LeadOut:
    return crud.create_lead(db, payload)


@router.get("/{lead_id}", response_model=schemas.LeadOut, responses=NOT_FOUND)
def get_lead(lead_id: int, db: DB) -> schemas.LeadOut:
    return crud.get_lead(db, lead_id)


@router.patch("/{lead_id}", response_model=schemas.LeadOut, responses=NOT_FOUND)
def update_lead(lead_id: int, payload: schemas.LeadUpdate, db: DB) -> schemas.LeadOut:
    """Partially update a lead: status, contact details, or follow-up (send null to clear it)."""
    return crud.update_lead(db, lead_id, payload)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, responses=NOT_FOUND)
def delete_lead(lead_id: int, db: DB) -> Response:
    crud.delete_lead(db, lead_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
