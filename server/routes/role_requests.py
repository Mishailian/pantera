from datetime import datetime

from flask import Blueprint, request, jsonify
from extensions import db
from services.auth_service import AuthService
from models.user.roleChangeRequest import RoleChangeRequest
from models.user.user_profile_history import UserProfileHistory
from models.user.role import Role
from utils.serializers import serialize_role_request

role_requests_bp = Blueprint("role_requests", __name__, url_prefix="/api/v1/role-requests")

# Роли, требующие одобрения начальника, и кто именно одобряет
ROLE_HEAD_MAP = {
    "supply_manager":  "supply_head",
    "rezo_department": "rezo_head",
    "it_department":   "it_head",
}
REQUIRES_APPROVAL = set(ROLE_HEAD_MAP.keys())


def _get_allowed_roles_for_head(actor):
    """Возвращает список ролей, заявки на которые видит данный пользователь."""
    allowed = []
    for role_name, head_role in ROLE_HEAD_MAP.items():
        if actor.has_role(head_role) or actor.has_role("admin"):
            allowed.append(role_name)
    return allowed


@role_requests_bp.get("/count")
def get_pending_count():
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)
    if not actor:
        return jsonify({"count": 0})

    allowed = _get_allowed_roles_for_head(actor)
    if not allowed:
        return jsonify({"count": 0})

    count = RoleChangeRequest.query.filter(
        RoleChangeRequest.requested_role.in_(allowed),
        RoleChangeRequest.status == "pending",
    ).count()

    return jsonify({"count": count})


@role_requests_bp.get("/")
def list_requests():
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)
    if not actor:
        return jsonify({"error": "Unauthorized"}), 401

    allowed = _get_allowed_roles_for_head(actor)
    if not allowed:
        return jsonify([])

    reqs = (
        RoleChangeRequest.query
        .filter(
            RoleChangeRequest.requested_role.in_(allowed),
            RoleChangeRequest.status == "pending",
        )
        .order_by(RoleChangeRequest.created_at.desc())
        .all()
    )
    return jsonify([serialize_role_request(r) for r in reqs])


@role_requests_bp.get("/my")
def my_requests():
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)
    if not actor:
        return jsonify({"error": "Unauthorized"}), 401

    reqs = (
        RoleChangeRequest.query
        .filter_by(user_id=actor.id, status="pending")
        .order_by(RoleChangeRequest.created_at.desc())
        .all()
    )
    return jsonify([serialize_role_request(r) for r in reqs])


@role_requests_bp.post("/")
def create_request():
    data = request.get_json() or {}
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)
    if not actor:
        return jsonify({"error": "Unauthorized"}), 401

    requested_role = (data.get("requested_role") or "").strip()
    if requested_role not in REQUIRES_APPROVAL:
        return jsonify({"error": "Для этой роли одобрение не требуется"}), 400

    if actor.has_role(requested_role):
        return jsonify({"error": "У вас уже есть эта роль"}), 400

    existing = RoleChangeRequest.query.filter_by(
        user_id=actor.id, requested_role=requested_role, status="pending"
    ).first()
    if existing:
        return jsonify({"error": "Запрос уже отправлен, ожидайте одобрения"}), 400

    req = RoleChangeRequest(
        user_id=actor.id,
        requested_role=requested_role,
        status="pending",
    )
    db.session.add(req)
    db.session.commit()
    return jsonify(serialize_role_request(req)), 201


@role_requests_bp.patch("/<int:req_id>")
def review_request(req_id):
    data = request.get_json() or {}

    token = (
        request.headers
        .get("Authorization", "")
        .replace("Token ", "")
        .strip()
    )

    actor = AuthService.get_user_by_token(token)

    if not actor:
        return jsonify({"error": "Unauthorized"}), 401

    action = data.get("action")

    if action not in {"approve", "reject"}:
        return jsonify({
            "error": "action must be 'approve' or 'reject'"
        }), 400

    req = db.session.get(RoleChangeRequest, req_id)

    if not req:
        return jsonify({"error": "Запрос не найден"}), 404

    head_role = ROLE_HEAD_MAP.get(req.requested_role)

    can_review = (
        actor.has_role("admin")
        or (
            head_role is not None
            and actor.has_role(head_role)
        )
    )

    if not can_review:
        return jsonify({"error": "Access denied"}), 403

    if req.status != "pending":
        return jsonify({"error": "Запрос уже обработан"}), 400

    req.status = (
        "approved"
        if action == "approve"
        else "rejected"
    )

    req.reviewed_by_id = actor.id
    req.reviewed_at = datetime.utcnow()

    if action == "approve":
        from secrets import token_hex
        from models.user.user import User

        user = db.session.get(User, req.user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        role = Role.query.filter_by(
            name=req.requested_role
        ).first()

        if not role:
            return jsonify({
                "error": f"Role '{req.requested_role}' not found"
            }), 400

        old_role = user.role.name if user.role else None

        user.role = role

        if req.request_type == "registration":
            user.is_active = True

            if not user.token:
                user.token = token_hex(32)

        db.session.add(
            UserProfileHistory(
                target_user_id=user.id,
                changed_by_user_id=actor.id,
                change_type="role",
                changed_by_role=head_role or "admin",
                old_value=old_role,
                new_value=role.name,
            )
        )

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(serialize_role_request(req)), 200
