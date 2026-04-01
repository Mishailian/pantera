from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")

@users_bp.route("/")
def list_users():
    users = AuthService.get_users()
    return jsonify([{
        "id": u.id,
        "username": u.username,
        "is_superuser": u.is_superuser
    } for u in users])

@users_bp.route("/<int:user_id>")
def get_user(user_id):
    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "username": user.username,
        "is_superuser": user.is_superuser
    })
