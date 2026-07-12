from secrets import token_hex

from flask import Blueprint, request, jsonify

from extensions import db
from services.auth_service import AuthService
from utils.serializers import serialize_many, serialize_user, serialize_role
from models.user.role import Role
from models.user.user import User
from models.user.roleChangeRequest import RoleChangeRequest

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

HIDDEN_FROM_REGISTRATION = {"admin", "supply_head", "it_head"}
ROLES_REQUIRING_APPROVAL = {"supply_manager", "it_department"}


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    number = (data.get("number") or "").strip()
    password = data.get("password") or ""

    if not number or not password:
        return jsonify({"error": "Номер и пароль обязательны"}), 400

    user = User.query.filter_by(number=number).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Неверный номер или пароль"}), 401

    if not user.is_active:
        return jsonify({
            "error": "Аккаунт ожидает подтверждения. Обратитесь к начальнику отдела или администратору.",
            "pending": True
        }), 403

    if not user.token:
        user.token = token_hex(32)
        db.session.commit()

    return jsonify({"token": user.token, "user": serialize_user(user)})


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    role_name = (data.get("role_name") or "").strip()

    if role_name in ROLES_REQUIRING_APPROVAL:
        try:
            user = AuthService.create_user(
                password=data.get("password"),
                full_name=data.get("full_name"),
                role_name=role_name,
                number=data.get("number"),
                is_active=False,
            )
            req = RoleChangeRequest(
                user_id=user.id,
                requested_role=role_name,
                status="pending",
                request_type="registration",
            )
            db.session.add(req)
            db.session.commit()
            return jsonify({
                "pending": True,
                "message": "Аккаунт создан и ожидает подтверждения. Как только начальник отдела одобрит вашу заявку, вы сможете войти.",
            }), 202
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    try:
        user = AuthService.create_user(
            password=data.get("password"),
            full_name=data.get("full_name"),
            role_name=role_name,
            number=data.get("number"),
        )
        return jsonify({"token": user.token, "user": serialize_user(user)}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

