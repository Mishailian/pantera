from flask import Blueprint, request, jsonify

from services.auth_service import AuthService
from utils.serializers import serialize_many, serialize_user

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