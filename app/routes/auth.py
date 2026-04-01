from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.utils.serializers import serialize_many

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    user = AuthService.authenticate_user(data.get("username"), data.get("password"))
    
    if user:
        return jsonify({
            "token": user.token,
            "user": {
                "id": user.id,
                "username": user.username,
                "is_superuser": user.is_superuser
            }
        })
    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    try:
        user = AuthService.create_user(
            data.get("username"),
            data.get("password"),
            data.get("author_name")
        )
        return jsonify({
            "id": user.id,
            "username": user.username,
            "token": user.token
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.get("/users")
def list_users():
    users = AuthService.get_users()
    return jsonify(serialize_many(users, lambda u: {
        "id": u.id,
        "username": u.username,
        "is_superuser": u.is_superuser
    }))
