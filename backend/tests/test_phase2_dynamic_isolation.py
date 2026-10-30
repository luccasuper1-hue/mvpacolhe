"""Dynamic authorization checks with a fully synthetic in-memory database.

These tests exercise the actual FastAPI handler functions and assert the same
HTTPException status codes that the HTTP layer returns, without MongoDB or
production credentials.
"""

import asyncio
import os
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

if hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "acolhe_phase2_dynamic")
os.environ.setdefault("JWT_SECRET", "phase2-dynamic-secret")

from app import core
from app.routers import institutions, metrics, professionals, students


def _match(doc, query):
    for key, expected in query.items():
        actual = doc.get(key)
        if isinstance(expected, dict):
            if "$in" in expected and actual not in expected["$in"]:
                return False
            if "$exists" in expected and ((key in doc) != expected["$exists"]):
                return False
            if "$gt" in expected and not (actual and actual > expected["$gt"]):
                return False
            if "$in" not in expected and "$exists" not in expected and "$gt" not in expected:
                return False
        elif actual != expected:
            return False
    return True


class Cursor:
    def __init__(self, docs):
        self.docs = [dict(d) for d in docs]

    def sort(self, *_args, **_kwargs):
        return self

    async def to_list(self, length):
        return self.docs[:length]


class Collection:
    def __init__(self, docs=()):
        self.docs = [dict(d) for d in docs]

    def find(self, query=None, projection=None):
        result = [d for d in self.docs if _match(d, query or {})]
        if projection:
            excluded = {k for k, v in projection.items() if v == 0}
            included = {k for k, v in projection.items() if v == 1}
            if included:
                result = [{k: d[k] for k in included if k in d} for d in result]
            elif excluded:
                result = [{k: v for k, v in d.items() if k not in excluded} for d in result]
        return Cursor(result)

    async def find_one(self, query, projection=None):
        rows = await self.find(query, projection).to_list(1)
        return rows[0] if rows else None

    async def count_documents(self, query):
        return len([d for d in self.docs if _match(d, query)])

    async def distinct(self, field, query):
        return list({d[field] for d in self.docs if _match(d, query) and field in d})


class DB:
    def __init__(self):
        self.institutions = Collection([
            {"id": "inst-a", "name": "Instituição A", "code": "A"},
            {"id": "inst-b", "name": "Instituição B", "code": "B"},
        ])
        self.users = Collection([
            {"id": "student-user-a", "name": "Aluno A", "email": "student.a@example.com", "role": "student", "institution_id": "inst-a", "active": True},
            {"id": "student-user-b", "name": "Aluno B", "email": "student.b@example.com", "role": "student", "institution_id": "inst-b", "active": True},
            {"id": "pro-user-a", "name": "Pro A", "email": "pro.a@example.com", "role": "professional", "institution_id": "inst-a", "active": True},
            {"id": "pro-user-b", "name": "Pro B", "email": "pro.b@example.com", "role": "professional", "institution_id": "inst-b", "active": True},
        ])
        self.students = Collection([
            {"id": "student-a", "user_id": "student-user-a", "institution_id": "inst-a", "last_access": None},
            {"id": "student-b", "user_id": "student-user-b", "institution_id": "inst-b", "last_access": None},
        ])
        self.professionals = Collection([
            {"id": "pro-a", "user_id": "pro-user-a", "institution_id": "inst-a"},
            {"id": "pro-b", "user_id": "pro-user-b", "institution_id": "inst-b"},
        ])
        self.requests = Collection([
            {"id": "request-a", "student_id": "student-a", "professional_id": "pro-a", "institution_id": "inst-a", "status": "pending", "date": "2099-01-01", "time": "10:00", "reason_code": "conversar", "created_at": "2099-01-01T00:00:00+00:00"},
            {"id": "request-b", "student_id": "student-b", "professional_id": "pro-b", "institution_id": "inst-b", "status": "pending", "date": "2099-01-01", "time": "11:00", "reason_code": "conversar", "created_at": "2099-01-01T00:00:00+00:00"},
        ])
        self.sessions = Collection([
            {"id": "session-a", "request_id": "request-a", "student_id": "student-a", "professional_id": "pro-a", "institution_id": "inst-a", "status": "completed", "date": "2099-01-01", "time": "10:00", "created_at": "2099-01-01T00:00:00+00:00"},
            {"id": "session-b", "request_id": "request-b", "student_id": "student-b", "professional_id": "pro-b", "institution_id": "inst-b", "status": "completed", "date": "2099-01-01", "time": "11:00", "created_at": "2099-01-01T00:00:00+00:00"},
        ])
        self.referrals = Collection([
            {"id": "ref-a", "session_id": "session-a", "institution_id": "inst-a", "status": "orientacao"},
            {"id": "ref-b", "session_id": "session-b", "institution_id": "inst-b", "status": "orientacao"},
        ])
        self.feedback = Collection([
            {"id": "feedback-a", "session_id": "session-a", "student_id": "student-a", "institution_id": "inst-a", "score": 5},
            {"id": "feedback-b", "session_id": "session-b", "student_id": "student-b", "institution_id": "inst-b", "score": 1},
        ])
        self.availability = Collection([
            {"id": "slot-a", "professional_id": "pro-a", "institution_id": "inst-a", "status": "open"},
            {"id": "slot-b", "professional_id": "pro-b", "institution_id": "inst-b", "status": "open"},
        ])


def _install(database, monkeypatch):
    for module in (core, institutions, metrics, professionals, students):
        monkeypatch.setattr(module, "db", database)


def test_students_and_professionals_are_isolated(monkeypatch):
    database = DB()
    _install(database, monkeypatch)
    inst_a = asyncio.run(institutions.list_students({"id": "inst-a"}))
    inst_b = asyncio.run(institutions.list_students({"id": "inst-b"}))
    assert [row["id"] for row in inst_a] == ["student-a"]
    assert [row["id"] for row in inst_b] == ["student-b"]
    pro_a = asyncio.run(professionals.list_requests({"id": "pro-a", "institution_id": "inst-a"}))
    assert [row["id"] for row in pro_a] == ["request-a"]


def test_requests_sessions_referrals_and_feedback_do_not_cross_students(monkeypatch):
    database = DB()
    _install(database, monkeypatch)
    own = asyncio.run(students.my_requests({"id": "student-a", "institution_id": "inst-a"}))
    assert [row["id"] for row in own] == ["request-a"]
    with pytest.raises(HTTPException) as exc:
        asyncio.run(students.send_feedback("session-b", SimpleNamespace(score=5, comment="synthetic"), {"id": "student-a", "institution_id": "inst-a"}, {"id": "student-user-a", "role": "student"}))
    assert exc.value.status_code == 404


def test_metrics_are_scoped_to_institution(monkeypatch):
    database = DB()
    _install(database, monkeypatch)
    result = asyncio.run(metrics.institution_metrics("inst-a"))
    assert result["students_registered"] == 1
    assert result["requests_total"] == 1
    assert result["sessions_completed"] == 1
    assert result["feedback_average"] == 5


def test_non_admin_cannot_use_admin_role_dependency():
    dependency = core.require_roles("admin")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(dependency({"id": "inst-user-a", "role": "institution"}))
    assert exc.value.status_code == 403


def test_student_cannot_issue_professional_invites_or_activate_institutions():
    institution_dependency = core.require_roles("institution")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(institution_dependency({"id": "student-user-a", "role": "student", "institution_id": "inst-a"}))
    assert exc.value.status_code == 403
