import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://legal-ops-ai-2.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200


def test_create_waitlist_full(client):
    payload = {
        "name": "TEST_Full User",
        "email": "test_full@example.com",
        "company": "TEST Co",
        "team_size": "11-50",
        "message": "hello"
    }
    r = client.post(f"{API}/waitlist", json=payload)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "id" in data and isinstance(data["id"], str)
    for k, v in payload.items():
        assert data[k] == v

    # Persist check
    r2 = client.get(f"{API}/waitlist")
    assert r2.status_code == 200
    ids = [e["id"] for e in r2.json()]
    assert data["id"] in ids


def test_create_waitlist_minimal(client):
    payload = {"name": "TEST_Min", "email": "test_min@example.com"}
    r = client.post(f"{API}/waitlist", json=payload)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data.get("company", "") == ""
    assert data.get("team_size", "") == ""
    assert data.get("message", "") == ""
    assert "id" in data


def test_create_waitlist_missing_required(client):
    r = client.post(f"{API}/waitlist", json={"name": "only"})
    assert r.status_code == 422
