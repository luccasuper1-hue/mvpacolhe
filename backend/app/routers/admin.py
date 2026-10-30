import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from ..core import db, require_roles, new_id, now, now_iso, log_event
from ..schemas import InstitutionInput, CrpVerificationInput

router = APIRouter(prefix="/admin", tags=["admin"])
admin_only = require_roles("admin")


@router.get("/users")
async def list_users(user: dict = Depends(admin_only)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    institutions = {i["id"]: i["name"] for i in await db.institutions.find({}, {"_id": 0}).to_list(200)}
    return [{k: v for k, v in {**u, "invite_pending": bool(u.get("invite_token")), "institution_name": institutions.get(u.get("institution_id"))}.items() if k not in {"invite_token", "invite_expires_at"}} for u in users]


@router.post("/professionals/{professional_id}/crp-verification")
async def verify_crp(professional_id: str, payload: CrpVerificationInput, user: dict = Depends(admin_only)):
    professional = await db.professionals.find_one({"id": professional_id}, {"_id": 0})
    if not professional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    changed_at = now_iso()
    await db.professionals.update_one({"id": professional_id}, {"$set": {
        "crp_verified": payload.verified,
        "crp_verified_at": changed_at,
        "crp_verified_by": user["id"],
        "crp_verification_source": payload.source.strip(),
    }})
    await log_event("crp_verification_changed", user, professional.get("institution_id"), {
        "professional_id": professional_id, "verified": payload.verified, "source": payload.source.strip(),
    })
    return {"id": professional_id, "crp_verified": payload.verified, "crp_verified_at": changed_at,
            "crp_verified_by": user["id"], "crp_verification_source": payload.source.strip()}


@router.post("/users/{user_id}/toggle-active")
async def toggle_active(user_id: str, user: dict = Depends(admin_only)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target["role"] == "admin":
        raise HTTPException(status_code=403, detail="Não é possível desativar um administrador")
    active = not target.get("active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"active": active}})
    await log_event("user_access_toggled", user, target.get("institution_id"), {"target": user_id, "active": active})
    return {"id": user_id, "active": active}


@router.get("/institutions")
async def list_institutions(user: dict = Depends(admin_only)):
    institutions = await db.institutions.find({}, {"_id": 0}).to_list(200)
    for i in institutions:
        i["students"] = await db.students.count_documents({"institution_id": i["id"]})
        i["professionals"] = await db.professionals.count_documents({"institution_id": i["id"]})
    return institutions


@router.post("/institutions", status_code=201)
async def create_institution(payload: InstitutionInput, user: dict = Depends(admin_only)):
    if payload.admin_password:
        raise HTTPException(status_code=422, detail="A conta institucional deve ser ativada exclusivamente por convite")
    code = payload.code.upper().strip()
    if await db.institutions.find_one({"code": code}):
        raise HTTPException(status_code=409, detail="Código de instituição já utilizado")
    if payload.admin_email and await db.users.find_one({"email": payload.admin_email.lower()}):
        raise HTTPException(status_code=409, detail="E-mail do gestor já possui conta")
    institution = {
        "id": new_id(), "name": payload.name.strip(), "code": code,
        "contact_email": payload.contact_email, "plan": "piloto",
        "support_note": None, "created_at": now_iso(),
    }
    await db.institutions.insert_one(dict(institution))
    invite_path = None
    if payload.admin_email:
        invite_token = secrets.token_urlsafe(24)
        invite_path = f"/convite/{invite_token}"
        await db.users.insert_one({
            "id": new_id(), "name": payload.admin_name or payload.name,
            "email": payload.admin_email.lower(), "password_hash": "",
            "role": "institution", "institution_id": institution["id"], "active": False,
            "invite_token": invite_token,
            "invite_expires_at": (now() + timedelta(days=14)).isoformat(),
            "created_at": now_iso(),
        })
    await log_event("institution_created", user, institution["id"])
    return {**institution, "invite_path": invite_path}


@router.get("/requests")
async def list_requests(user: dict = Depends(admin_only)):
    requests = await db.requests.find({}, {"_id": 0, "reason_note": 0}).sort("created_at", -1).to_list(500)
    institutions = {i["id"]: i["name"] for i in await db.institutions.find({}, {"_id": 0}).to_list(200)}
    return [{**r, "institution_name": institutions.get(r.get("institution_id"))} for r in requests]
