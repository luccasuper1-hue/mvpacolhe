import asyncio
import os
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

if hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "acolhe_phase2_unit_test")
os.environ.setdefault("JWT_SECRET", "phase2-unit-test-secret")

from app.routers import admin
from app.schemas import InstitutionInput


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, query, *_args, **_kwargs):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return dict(doc)
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))


class FakeDB:
    def __init__(self):
        self.institutions = FakeCollection()
        self.users = FakeCollection()
        self.events = FakeCollection()


def test_admin_cannot_activate_institution_by_direct_password(monkeypatch):
    database = FakeDB()
    monkeypatch.setattr(admin, "db", database)
    payload = InstitutionInput(
        name="Instituição Sintética", code="SINT-001",
        admin_email="gestor.phase2@example.com", admin_password="senha-segura-123",
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(admin.create_institution(payload, {"id": "admin-1", "role": "admin"}))
    assert exc.value.status_code == 422
    assert database.institutions.docs == []
    assert database.users.docs == []


def test_institution_account_is_pending_until_invite_acceptance(monkeypatch):
    database = FakeDB()
    monkeypatch.setattr(admin, "db", database)
    monkeypatch.setattr(admin, "log_event", lambda *args, **kwargs: asyncio.sleep(0))
    payload = InstitutionInput(
        name="Instituição Sintética", code="SINT-002",
        admin_email="gestor2.phase2@example.com",
    )
    result = asyncio.run(admin.create_institution(payload, {"id": "admin-1", "role": "admin"}))
    assert result["invite_path"].startswith("/convite/")
    account = database.users.docs[0]
    assert account["role"] == "institution"
    assert account["active"] is False
    assert account["password_hash"] == ""
    assert account["invite_token"]
    assert account["invite_expires_at"]
