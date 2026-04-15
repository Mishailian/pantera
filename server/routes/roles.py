from flask import Blueprint, request, jsonify

from models.user.role import Role
from services.auth_service import AuthService
from utils.serializers import serialize_many, serialize_role
from extensions import db

roles_bp = Blueprint("roles", __name__, url_prefix="/api/v1/roles")


def get_actor_from_request():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Token "):
        return None

    token = auth_header.replace("Token ", "").strip()
    if not token:
        return None

    return AuthService.get_user_by_token(token)


@roles_bp.get("/")
def list_roles():
    actor = get_actor_from_request()
    if not actor or not actor.has_role("admin"):
        return jsonify({"error": "Access denied"}), 403

    roles = Role.query.order_by(Role.id.asc()).all()
    return jsonify(serialize_many(roles, serialize_role)), 200


@roles_bp.post("/")
def create_role():
    actor = get_actor_from_request()
    if not actor or not actor.has_role("admin"):
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()

    if not name:
        return jsonify({"error": "name is required"}), 400

    if len(name) > 50:
        return jsonify({"error": "name is too long"}), 400

    normalized_name = name.lower().replace(" ", "_")

    exists = Role.query.filter_by(name=normalized_name).first()
    if exists:
        return jsonify({"error": "Role already exists"}), 400

    role = Role(
        name=normalized_name,
        description=description or normalized_name,
    )

    db.session.add(role)
    db.session.commit()

    return jsonify(serialize_role(role)), 201