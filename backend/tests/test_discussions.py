from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.seed import seed, seed_if_empty


def test_add_discussion_returns_discussion_and_updated_lead(client: TestClient, lead: dict) -> None:
    response = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "  Sent pricing PDF  ", "follow_up_at": "2030-05-06T14:00:00Z"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["discussion"]["note"] == "Sent pricing PDF"
    assert body["discussion"]["kind"] == "note"
    assert body["discussion"]["follow_up_at"] == "2030-05-06T14:00:00Z"
    # The lead in the response already reflects the new note and follow-up.
    assert body["lead"]["last_note"] == "Sent pricing PDF"
    assert body["lead"]["follow_up_at"] == "2030-05-06T14:00:00Z"
    assert client.get(f"/api/leads/{lead['id']}").json()["follow_up_at"] == "2030-05-06T14:00:00Z"


def test_follow_up_with_offset_is_stored_as_utc(client: TestClient, lead: dict) -> None:
    response = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "Call", "follow_up_at": "2030-05-06T14:00:00+05:30"},
    )
    assert response.json()["lead"]["follow_up_at"] == "2030-05-06T08:30:00Z"


def test_discussion_without_follow_up_keeps_existing_follow_up(client: TestClient, lead: dict) -> None:
    url = f"/api/leads/{lead['id']}/discussions"
    client.post(url, json={"note": "Book a call", "follow_up_at": "2030-05-06T14:00:00Z"})

    response = client.post(url, json={"note": "Quick email, no new follow-up"})

    assert response.json()["lead"]["follow_up_at"] == "2030-05-06T14:00:00Z"


def test_timeline_is_newest_first(client: TestClient, lead: dict) -> None:
    url = f"/api/leads/{lead['id']}/discussions"
    for note in ["First", "Second", "Third"]:
        client.post(url, json={"note": note})

    response = client.get(url)

    assert response.status_code == 200
    assert [entry["note"] for entry in response.json()] == ["Third", "Second", "First", "Lead created."]


def test_add_discussion_validates_note(client: TestClient, lead: dict) -> None:
    url = f"/api/leads/{lead['id']}/discussions"
    assert client.post(url, json={"note": "   "}).status_code == 422
    assert client.post(url, json={}).status_code == 422
    assert client.post(url, json={"note": "x", "follow_up_at": "not-a-date"}).status_code == 422


def test_discussions_for_missing_lead_return_404(client: TestClient) -> None:
    assert client.get("/api/leads/999/discussions").status_code == 404
    assert client.post("/api/leads/999/discussions", json={"note": "Hi"}).status_code == 404


def test_seed_creates_demo_data_once(client: TestClient, db_session: Session) -> None:
    assert seed(db_session) >= 5
    assert seed_if_empty(db_session) == 0

    leads = client.get("/api/leads").json()
    assert len(leads) >= 5
    assert all(lead["last_note"] for lead in leads)
    assert any(lead["follow_up_at"] for lead in leads)
