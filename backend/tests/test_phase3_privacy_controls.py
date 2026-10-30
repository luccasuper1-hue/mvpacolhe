import asyncio

import pytest
from fastapi import HTTPException

from app.routers import professionals


def test_unverified_professional_is_blocked(monkeypatch):
    async def fake_profile(_user):
        return {"id": "pro-pending", "institution_id": "inst-a", "crp_verified": False}

    monkeypatch.setattr(professionals, "profile_of", fake_profile)
    with pytest.raises(HTTPException) as error:
        asyncio.run(professionals.current_professional({"id": "user-pending", "role": "professional"}))
    assert error.value.status_code == 403


def test_verified_professional_can_continue(monkeypatch):
    expected = {"id": "pro-verified", "institution_id": "inst-a", "crp_verified": True}

    async def fake_profile(_user):
        return expected

    monkeypatch.setattr(professionals, "profile_of", fake_profile)
    assert asyncio.run(professionals.current_professional({"id": "user-verified", "role": "professional"})) == expected
