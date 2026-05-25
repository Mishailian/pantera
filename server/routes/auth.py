from flask import Blueprint, request, jsonify

from services.auth_service import AuthService
from utils.serializers import serialize_many, serialize_user, serialize_role
from models.user.role import Role

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}

    user = AuthService.authenticate_user(
        data.get("number"),
        data.get("password"),
    )

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "token": user.token,
        "user": serialize_user(user),
    })


@auth_bp.post("/register")
@auth_bp.post("/register")
def register():
    data = request.get_json() or {}

    try:
        user = AuthService.create_user(
            password=data.get("password"),
            full_name=data.get("full_name"),
            role_name=data.get("role_name"),
            number=data.get("number"),
        )
        return jsonify({
            "token": user.token,
            "user": serialize_user(user),
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@auth_bp.get("/roles")
def list_roles():
    roles = Role.query.order_by(Role.id.asc()).all()
    available_roles = [role for role in roles if role.name != "admin"]
    return jsonify(serialize_many(available_roles, serialize_role))


@auth_bp.get("/users")
def list_users():
    users = AuthService.get_users()
    return jsonify(serialize_many(users, serialize_user))
