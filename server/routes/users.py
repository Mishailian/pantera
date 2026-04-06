from flask import Blueprint, jsonify

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
