from fastapi.testclient import TestClient


def test_create_lead_defaults_to_new(client: TestClient) -> None:
    response = client.post("/api/leads", json={"name": "  Hank Scorpio  ", "company": "", "phone": "555-0142"})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Hank Scorpio"
    assert body["company"] is None
    assert body["phone"] == "555-0142"
    assert body["status"] == "new"
    assert body["follow_up_at"] is None
    assert body["last_note"] is None


def test_create_lead_requires_name(client: TestClient) -> None:
    assert client.post("/api/leads", json={"name": "   "}).status_code == 422
    assert client.post("/api/leads", json={"company": "Globex"}).status_code == 422


def test_get_lead(client: TestClient, lead: dict) -> None:
    response = client.get(f"/api/leads/{lead['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Sarah Connor"


def test_get_missing_lead_returns_404(client: TestClient) -> None:
    response = client.get("/api/leads/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Lead 999 not found"}


def test_list_shows_last_note_and_orders_by_recent_activity(client: TestClient) -> None:
    first = client.post("/api/leads", json={"name": "First"}).json()
    client.post("/api/leads", json={"name": "Second"})
    client.post(f"/api/leads/{first['id']}/discussions", json={"note": "Older note"})
    client.post(f"/api/leads/{first['id']}/discussions", json={"note": "Newest note"})

    leads = client.get("/api/leads").json()

    assert [lead["name"] for lead in leads] == ["First", "Second"]
    assert leads[0]["last_note"] == "Newest note"
    assert leads[0]["last_discussion_at"] is not None
    # System entries such as "Lead created." are not counted as discussions.
    assert leads[1]["last_note"] is None


def test_list_filters_by_status(client: TestClient) -> None:
    client.post("/api/leads", json={"name": "New lead"})
    client.post("/api/leads", json={"name": "Won lead", "status": "won"})

    response = client.get("/api/leads", params={"status": "won"})

    assert response.status_code == 200
    assert [lead["name"] for lead in response.json()] == ["Won lead"]


def test_list_rejects_unknown_status(client: TestClient) -> None:
    assert client.get("/api/leads", params={"status": "bogus"}).status_code == 422


def test_search_matches_name_or_company_case_insensitively(client: TestClient) -> None:
    client.post("/api/leads", json={"name": "Bill Lumbergh", "company": "Initech"})
    client.post("/api/leads", json={"name": "Bruce Wayne", "company": "Wayne Ent"})
    client.post("/api/leads", json={"name": "100% Real Lead"})

    def names(search: str) -> list[str]:
        return sorted(lead["name"] for lead in client.get("/api/leads", params={"search": search}).json())

    assert names("BILL") == ["Bill Lumbergh"]
    assert names("wayne") == ["Bruce Wayne"]
    assert names("initech") == ["Bill Lumbergh"]
    # LIKE wildcards are matched literally.
    assert names("%") == ["100% Real Lead"]


def test_update_status_persists_and_is_logged(client: TestClient, lead: dict) -> None:
    response = client.patch(f"/api/leads/{lead['id']}", json={"status": "qualified"})

    assert response.status_code == 200
    assert response.json()["status"] == "qualified"
    assert client.get(f"/api/leads/{lead['id']}").json()["status"] == "qualified"

    latest = client.get(f"/api/leads/{lead['id']}/discussions").json()[0]
    assert latest["kind"] == "system"
    assert latest["note"] == "Status changed: New → Qualified"


def test_update_to_same_status_is_not_logged(client: TestClient, lead: dict) -> None:
    client.patch(f"/api/leads/{lead['id']}", json={"status": "new"})
    timeline = client.get(f"/api/leads/{lead['id']}/discussions").json()
    assert [entry["note"] for entry in timeline] == ["Lead created."]


def test_update_rejects_invalid_values(client: TestClient, lead: dict) -> None:
    assert client.patch(f"/api/leads/{lead['id']}", json={"status": "bogus"}).status_code == 422
    assert client.patch(f"/api/leads/{lead['id']}", json={"status": None}).status_code == 422
    assert client.patch(f"/api/leads/{lead['id']}", json={"name": ""}).status_code == 422


def test_update_can_clear_follow_up(client: TestClient, lead: dict) -> None:
    client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "Call back", "follow_up_at": "2030-01-01T10:00:00Z"},
    )
    response = client.patch(f"/api/leads/{lead['id']}", json={"follow_up_at": None})
    assert response.status_code == 200
    assert response.json()["follow_up_at"] is None


def test_update_missing_lead_returns_404(client: TestClient) -> None:
    assert client.patch("/api/leads/999", json={"status": "won"}).status_code == 404


def test_delete_lead_removes_it_and_its_discussions(client: TestClient, lead: dict) -> None:
    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "Hello"})

    assert client.delete(f"/api/leads/{lead['id']}").status_code == 204
    assert client.get(f"/api/leads/{lead['id']}").status_code == 404
    assert client.delete(f"/api/leads/{lead['id']}").status_code == 404
