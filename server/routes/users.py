from models.request.request import Request
from utils.serializers import serialize_many, serialize_user, serialize_request
from flask import Blueprint, request, jsonify
from models.user.role import Role
from services.auth_service import AuthService
from extensions import db
from models.user.user_profile_history import UserProfileHistory
from models.user.user import User
from utils.serializers import format_datetime_ekb
from utils.stats import increment_stat

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")

# Роли, которым разрешено управлять аккаунтами пользователей
CAN_MANAGE_USERS = {"admin", "it_department", "it_head", "supply_head"}


def _can_manage(actor):
    return any(actor.has_role(r) for r in CAN_MANAGE_USERS)


def _actor_role_label(actor):
    for role in ("admin", "supply_head", "it_head", "it_department"):
        if actor.has_role(role):
            return role
    return "admin"


@users_bp.get("/")
def list_users():
    users = AuthService.get_users()
    return jsonify(serialize_many(users, serialize_user))



HEAD_ROLE_MAP = {
    "supply_manager":  "supply_head",
    "rezo_department": "rezo_head",
    "it_department":   "it_head",
}
HEAD_ROLE_NAMES = set(HEAD_ROLE_MAP.values())


@users_bp.post("/<int:user_id>/head")
def assign_head(user_id):
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor or not actor.has_role("admin"):
        return jsonify({"error": "Access denied"}), 403

    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    main_role_name = next(
        (r.name for r in user.roles if r.name not in HEAD_ROLE_NAMES), None
    )
    head_role_name = HEAD_ROLE_MAP.get(main_role_name)

    if not head_role_name:
        return jsonify({
            "error": "Нельзя назначить начальником: подходящие роли — supply_manager, it_department"
        }), 400

    if user.has_role(head_role_name):
        return jsonify({"error": "Пользователь уже является начальником"}), 400

    head_role = Role.query.filter_by(name=head_role_name).first()
    if not head_role:
        return jsonify({"error": f"Роль {head_role_name} не найдена в системе"}), 500

    user.add_role(head_role)
    db.session.commit()
    return jsonify(serialize_user(user)), 200


@users_bp.delete("/<int:user_id>/head")
def remove_head(user_id):
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor or not actor.has_role("admin"):
        return jsonify({"error": "Access denied"}), 403

    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    head_role = next((r for r in user.roles if r.name in HEAD_ROLE_NAMES), None)
    if not head_role:
        return jsonify({"error": "Пользователь не является начальником"}), 400

    user.remove_role(head_role)
    db.session.commit()
    return jsonify(serialize_user(user)), 200


_IT_ROLES = {"it_department", "it_head"}
_SUPPLY_ROLES = {"supply_manager", "supply_head"}
_ADMIN_ONLY_ROLES = {"admin", "supply_head", "it_head"}


@users_bp.patch("/<int:user_id>/roles")
def update_user_role(user_id):
    data = request.get_json() or {}
    role_name = data.get("role")

    if not role_name:
        return jsonify({"error": "role is required"}), 400

    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)
    if not actor:
        return jsonify({"error": "Authorization required"}), 401

    is_admin = actor.has_role("admin")
    is_it_actor = actor.has_role("it_department") or actor.has_role("it_head")
    is_supply_head_actor = actor.has_role("supply_head")

    if not (is_admin or is_it_actor or is_supply_head_actor):
        return jsonify({"error": "Access denied"}), 403

    if not is_admin:
        if role_name in _ADMIN_ONLY_ROLES:
            return jsonify({
                "error": "Нельзя назначить эту роль — обратитесь к администратору"
            }), 403
        if is_it_actor and role_name in _SUPPLY_ROLES:
            return jsonify({
                "error": "ОИТ не может назначать роли отдела снабжения"
            }), 403
        if is_supply_head_actor and role_name in _IT_ROLES:
            return jsonify({
                "error": "Отдел снабжения не может назначать роли ОИТ"
            }), 403

    target_user = AuthService.get_user_by_id(user_id)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": f"Role '{role_name}' not found"}), 400

    old_role = next(
        (r.name for r in target_user.roles if r.name not in HEAD_ROLE_NAMES),
        target_user.roles[0].name if target_user.roles else None
    )
    history = UserProfileHistory(
        target_user_id=target_user.id,
        changed_by_user_id=actor.id,
        change_type="role",
        changed_by_role=_actor_role_label(actor),
        old_value=old_role,
        new_value=role_name,
    )
    db.session.add(history)
    target_user.roles = [role]
    db.session.commit()
    return jsonify(serialize_user(target_user)), 200


@users_bp.get("/me")
def get_current_user():
    token = request.headers.get("Authorization", "").replace("Token ", "")
    user = AuthService.get_user_by_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 401
    return jsonify(serialize_user(user))


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
    has_number_change = new_number is not None and new_number != current_number

    if not has_full_name_change and not has_role_change and not has_number_change:
        return jsonify({"error": "Нет изменений для сохранения"}), 400

    if has_full_name_change:
        history = UserProfileHistory(
            target_user_id=actor.id,
            changed_by_user_id=actor.id,
            change_type="name",
            changed_by_role="self",
            old_full_name=actor.full_name,
            new_full_name=new_full_name,
            old_value=actor.full_name,
            new_value=new_full_name,
        )
        db.session.add(history)
        actor.full_name = new_full_name
        increment_stat(actor.id, "name_changes")

    if has_number_change:
        history = UserProfileHistory(
            target_user_id=actor.id,
            changed_by_user_id=actor.id,
            change_type="phone",
            changed_by_role="self",
            old_value=actor.number,
            new_value=new_number or None,
        )
        db.session.add(history)
        actor.number = new_number or None
        increment_stat(actor.id, "phone_changes")

    if has_role_change:
        if new_role_name in ("admin", "supply_head", "it_head"):
            return jsonify({"error": "Нельзя назначить себе эту роль"}), 400

        from routes.role_requests import REQUIRES_APPROVAL
        if new_role_name in REQUIRES_APPROVAL:
            return jsonify({
                "error": "Для этой роли требуется одобрение начальника. "
                         "Воспользуйтесь кнопкой «Запросить роль»."
            }), 400

        role = Role.query.filter_by(name=new_role_name).first()
        if not role:
            return jsonify({"error": f"Role '{new_role_name}' not found"}), 400

        old_role = actor.roles[0].name if actor.roles else None
        history = UserProfileHistory(
            target_user_id=actor.id,
            changed_by_user_id=actor.id,
            change_type="role",
            changed_by_role="self",
            old_value=old_role,
            new_value=new_role_name,
        )
        db.session.add(history)
        actor.roles = [role]

    db.session.commit()
    return jsonify(serialize_user(actor)), 200


@users_bp.get("/profile-history")
def get_profile_history():
    from datetime import datetime, timedelta
    from sqlalchemy import or_

    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor or not any(actor.has_role(r) for r in (
        "admin", "supply_manager", "supply_head", "rezo_department", "rezo_head", "it_department", "it_head"
    )):
        return jsonify({"error": "Access denied"}), 403

    number = request.args.get("number", "").strip()
    full_name = request.args.get("full_name", "").strip()
    date_value = request.args.get("date", "").strip()
    sort = request.args.get("sort", "desc").strip().lower()

    query = db.session.query(
        UserProfileHistory,
        User.number.label("target_number"),
        User.full_name.label("target_full_name"),
    ).outerjoin(
        User, User.id == UserProfileHistory.target_user_id
    )

    if number:
        query = query.filter(
            or_(
                User.number.ilike(f"%{number}%"),
                # Для удалённых юзеров ищем в old_value (формат: "номер | имя")
                UserProfileHistory.old_value.ilike(f"%{number}%"),
            )
        )

    if full_name:
        query = query.filter(
            or_(
                UserProfileHistory.old_full_name.ilike(f"%{full_name}%"),
                UserProfileHistory.new_full_name.ilike(f"%{full_name}%"),
                UserProfileHistory.old_value.ilike(f"%{full_name}%"),
                UserProfileHistory.new_value.ilike(f"%{full_name}%"),
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
    for history, target_number, target_full_name in rows:
        changed_by_user = (
            AuthService.get_user_by_id(history.changed_by_user_id)
            if history.changed_by_user_id else None
        )

        # Для удалённых юзеров восстанавливаем номер и имя из old_value ("номер | имя")
        if not target_number and history.change_type == "deletion" and history.old_value:
            parts = history.old_value.split(" | ", 1)
            target_number = parts[0].strip() if parts else None
            target_full_name = parts[1].strip() if len(parts) > 1 else None

        result.append({
            "id": history.id,
            "target_user_id": history.target_user_id,
            "target_number": target_number,
            "target_full_name": target_full_name,
            "changed_by_user_id": history.changed_by_user_id,
            "changed_by_number": changed_by_user.number if changed_by_user else None,
            "changed_by_name": changed_by_user.full_name if changed_by_user else None,
            "change_type": history.change_type or "name",
            "changed_by_role": history.changed_by_role,
            "old_full_name": history.old_full_name,
            "new_full_name": history.new_full_name,
            "old_value": history.old_value,
            "new_value": history.new_value,
            "changed_at": history.changed_at.isoformat() if history.changed_at else None,
            "changed_at_formatted": format_datetime_ekb(history.changed_at),
        })

    return jsonify(result), 200


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


@users_bp.patch("/<int:user_id>")
def update_user(user_id):
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor or not _can_manage(actor):
        return jsonify({"error": "Access denied"}), 403

    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    new_full_name = (data.get("full_name") or "").strip()
    new_number = (data.get("number") or "").strip()
    new_password = (data.get("password") or "").strip()

    changed = False
    actor_role = _actor_role_label(actor)

    if new_full_name and new_full_name != (user.full_name or "").strip():
        history = UserProfileHistory(
            target_user_id=user.id,
            changed_by_user_id=actor.id,
            change_type="name",
            changed_by_role=actor_role,
            old_full_name=user.full_name,
            new_full_name=new_full_name,
            old_value=user.full_name,
            new_value=new_full_name,
        )
        db.session.add(history)
        user.full_name = new_full_name
        changed = True

    if new_number and new_number != (user.number or "").strip():
        existing = User.query.filter_by(number=new_number).first()
        if existing and existing.id != user_id:
            return jsonify({"error": "Пользователь с таким номером уже существует"}), 400
        history = UserProfileHistory(
            target_user_id=user.id,
            changed_by_user_id=actor.id,
            change_type="phone",
            changed_by_role=actor_role,
            old_value=user.number,
            new_value=new_number,
        )
        db.session.add(history)
        user.number = new_number
        changed = True

    if new_password:
        user.set_password(new_password)
        history = UserProfileHistory(
            target_user_id=user.id,
            changed_by_user_id=actor.id,
            change_type="password",
            changed_by_role=actor_role,
        )
        db.session.add(history)
        changed = True

    if not changed:
        return jsonify({"error": "Нет изменений для сохранения"}), 400

    db.session.commit()
    return jsonify(serialize_user(user)), 200


@users_bp.delete("/<int:user_id>")
def delete_user(user_id):
    from sqlalchemy import text

    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)

    if not actor or not _can_manage(actor):
        return jsonify({"error": "Access denied"}), 403

    if actor.id == user_id:
        return jsonify({"error": "Нельзя удалить собственный аккаунт"}), 400

    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Только admin может удалять admin/head аккаунты
    if not actor.has_role("admin"):
        if user.has_role("admin") or user.has_role("supply_head") or user.has_role("it_head"):
            return jsonify({"error": "Недостаточно прав для удаления этого аккаунта"}), 403

    uid = user_id
    # Сохраняем данные юзера до удаления, пока объект ещё доступен
    deleted_user_number = user.number or "—"
    deleted_user_name = user.full_name or "—"

    try:
        from sqlalchemy import inspect as sa_inspect

        # Пишем лог удаления ДО чистки истории
        deletion_log = UserProfileHistory(
            target_user_id=uid,
            changed_by_user_id=actor.id,
            change_type="deletion",
            changed_by_role=_actor_role_label(actor),
            old_value=f"{deleted_user_number} | {deleted_user_name}",
        )
        db.session.add(deletion_log)
        db.session.flush()

        inspector = sa_inspect(db.engine)
        requests_fks = inspector.get_foreign_keys("requests")
        for fk in requests_fks:
            if fk["referred_table"] == "users" and fk["constrained_columns"]:
                col = fk["constrained_columns"][0]
                db.session.execute(
                    text(f"UPDATE requests SET {col} = NULL WHERE {col} = :uid"),
                    {"uid": uid},
                )

        db.session.execute(
            text("UPDATE request_status_history SET changed_by_id = NULL WHERE changed_by_id = :uid"),
            {"uid": uid},
        )
        # Удаляем всю историю КРОМЕ только что добавленной записи об удалении
        db.session.execute(
            text("DELETE FROM user_profile_history WHERE target_user_id = :uid AND change_type IS DISTINCT FROM 'deletion'"),
            {"uid": uid},
        )
        db.session.execute(
            text("UPDATE user_profile_history SET changed_by_user_id = NULL WHERE changed_by_user_id = :uid"),
            {"uid": uid},
        )

        # Удаляем юзера — FK ON DELETE SET NULL автоматически обнулит target_user_id в логе удаления
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Пользователь удалён"}), 200
