from models.request.request import Request
from utils.serializers import serialize_many, serialize_user, serialize_request
from flask import Blueprint, request, jsonify
from models.user.role import Role
from services.auth_service import AuthService
from utils.serializers import serialize_many, serialize_user
from extensions import db
from models.user.user_profile_history import UserProfileHistory
from models.user.user import User
from utils.serializers import format_datetime_ekb

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


@users_bp.get("/")
def list_users():
    users = AuthService.get_users()
    return jsonify(serialize_many(users, serialize_user))


@users_bp.get("/<int:user_id>")
def get_user(user_id):
    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user))


@users_bp.patch("/<int:user_id>/roles")
def update_user_role(user_id):
    data = request.get_json() or {}
    role_name = data.get("role")

    if not role_name:
        return jsonify({"error": "role is required"}), 400

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Token "):
        return jsonify({"error": "Authorization required"}), 401

    token = auth_header.replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor:
        return jsonify({"error": "Invalid token"}), 401

    try:
        updated_user = AuthService.assign_role(actor, user_id, role_name)
        return jsonify(serialize_user(updated_user)), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
# GET /api/v1/users/me — текущий профиль
@users_bp.get("/me")
def get_current_user():
    token = request.headers.get("Authorization", "").replace("Token ", "")
    user = AuthService.get_user_by_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 401
    return jsonify(serialize_user(user))

# PATCH /api/v1/users/me — обновить full_name
@users_bp.patch("/me")
def update_current_user():
    data = request.get_json() or {}

    new_full_name = (data.get("full_name") or "").strip()
    new_role_name = (data.get("role_name") or "").strip()
    new_number = data.get("number")
    if isinstance(new_number, str):
        new_number = new_number.strip()

    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor:
        return jsonify({"error": "Invalid token"}), 401

    current_full_name = (actor.full_name or "").strip()
    current_role_name = actor.roles[0].name if actor.roles else ""
    current_number = (actor.number or "").strip()


    has_full_name_change = new_full_name != current_full_name
    has_role_change = bool(new_role_name) and new_role_name != current_role_name
    has_number_change = new_number != current_number

    if not has_full_name_change and not has_role_change and not has_number_change:
        return jsonify({"error": "Нет изменений для сохранения"}), 400

    if has_full_name_change:
        history = UserProfileHistory(
            target_user_id=actor.id,
            changed_by_user_id=actor.id,
            old_full_name=actor.full_name,
            new_full_name=new_full_name,
        )
        db.session.add(history)
        actor.full_name = new_full_name

    if has_number_change:
        actor.number = new_number or None

    if has_role_change:
        if new_role_name == "admin":
            return jsonify({"error": "Нельзя назначить себе роль admin"}), 400

        role = Role.query.filter_by(name=new_role_name).first()
        if not role:
            return jsonify({"error": f"Role '{new_role_name}' not found"}), 400

        actor.roles = [role]

    db.session.commit()

    return jsonify(serialize_user(actor)), 200
# GET /api/v1/users/profile-history — история (только admin/supplymanager)

@users_bp.get("/profile-history")
def get_profile_history():
    from datetime import datetime, timedelta
    from sqlalchemy import or_
    from models.user.user import User
    from utils.serializers import format_datetime_ekb

    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor or not (actor.has_role("admin") or actor.has_role("supply_manager")):
        return jsonify({"error": "Access denied"}), 403

    username = request.args.get("username", "").strip()
    full_name = request.args.get("full_name", "").strip()
    date_value = request.args.get("date", "").strip()
    sort = request.args.get("sort", "desc").strip().lower()

    query = db.session.query(
        UserProfileHistory,
        User.username.label("target_username")
    ).join(
        User, User.id == UserProfileHistory.target_user_id
    )

    if username:
        query = query.filter(User.username.ilike(f"%{username}%"))

    if full_name:
        query = query.filter(
            or_(
                UserProfileHistory.old_full_name.ilike(f"%{full_name}%"),
                UserProfileHistory.new_full_name.ilike(f"%{full_name}%")
            )
        )

    if date_value:
        try:
            exact_date = datetime.strptime(date_value, "%Y-%m-%d")
            next_day = exact_date + timedelta(days=1)
            query = query.filter(UserProfileHistory.changed_at >= exact_date)
            query = query.filter(UserProfileHistory.changed_at < next_day)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if sort == "asc":
        query = query.order_by(UserProfileHistory.changed_at.asc())
    else:
        query = query.order_by(UserProfileHistory.changed_at.desc())

    rows = query.all()

    result = []
    for history, target_username in rows:
        changed_by_user = (
            AuthService.get_user_by_id(history.changed_by_user_id)
            if history.changed_by_user_id
            else None
        )

        result.append({
            "id": history.id,
            "target_user_id": history.target_user_id,
            "target_username": target_username,
            "changed_by_user_id": history.changed_by_user_id,
            "changed_by_username": changed_by_user.username if changed_by_user else None,
            "old_full_name": history.old_full_name,
            "new_full_name": history.new_full_name,
            "changed_at": history.changed_at.isoformat() if history.changed_at else None,
            "changed_at_formatted": format_datetime_ekb(history.changed_at),
        })

    return jsonify(result), 200

# GET /api/v1/users/me/requests — история заявок текущего пользователя
@users_bp.get("/me/requests")
def get_my_requests():
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor:
        return jsonify({"error": "Invalid token"}), 401

    requests_list = (
        Request.query
        .filter(Request.created_by_id == actor.id)
        .order_by(Request.created_at.desc())
        .all()
    )

    return jsonify(serialize_many(requests_list, serialize_request)), 200