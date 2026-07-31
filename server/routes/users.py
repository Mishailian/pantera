from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import String, cast, or_, text
from sqlalchemy.orm import aliased

from extensions import db
from models.request.request import Request
from models.request.requestItem import RequestItem
from models.user.role import Role
from models.user.user import User
from models.user.user_profile_history import UserProfileHistory
from services.auth_service import AuthService
from utils.serializers import (
    format_datetime_ekb,
    serialize_many,
    serialize_request,
    serialize_user,
)
from utils.stats import increment_stat


users_bp = Blueprint(
    "users",
    __name__,
    url_prefix="/api/v1/users",
)


DEFAULT_PAGE_SIZE = 15
MAX_PAGE_SIZE = 100


VALID_REQUEST_STATUSES = {
    "undeclared",
    "active",
    "archived",
}


CAN_MANAGE_USERS = {
    "admin",
    "it_department",
    "it_head",
    "supply_head",
}


HEAD_ROLE_MAP = {
    "supply_manager": "supply_head",
    "rezo_department": "rezo_head",
    "it_department": "it_head",
}


HEAD_TO_BASE_ROLE = {
    head_role: base_role
    for base_role, head_role in HEAD_ROLE_MAP.items()
}


HEAD_ROLE_NAMES = set(
    HEAD_TO_BASE_ROLE.keys()
)


_IT_ROLES = {
    "it_department",
    "it_head",
}


_SUPPLY_ROLES = {
    "supply_manager",
    "supply_head",
}


_ADMIN_ONLY_ROLES = {
    "admin",
    "supply_head",
    "rezo_head",
    "it_head",
}


DEPARTMENT_ROLE_GROUPS = {
    "supply_manager": {
        "supply_manager",
        "supply_head",
    },
    "supply_head": {
        "supply_manager",
        "supply_head",
    },

    "rezo_department": {
        "rezo_department",
        "rezo_head",
    },
    "rezo_head": {
        "rezo_department",
        "rezo_head",
    },

    "it_department": {
        "it_department",
        "it_head",
    },
    "it_head": {
        "it_department",
        "it_head",
    },
}


def _get_actor():
    auth_header = request.headers.get(
        "Authorization"
    )

    if not auth_header:
        return None

    parts = auth_header.strip().split(
        None,
        1,
    )

    if len(parts) != 2:
        return None

    scheme, token = parts

    if scheme.lower() not in {
        "token",
        "bearer",
    }:
        return None

    token = token.strip()

    if not token:
        return None

    return AuthService.get_user_by_token(
        token
    )


def _can_manage(actor: User) -> bool:
    return any(
        actor.has_role(role_name)
        for role_name in CAN_MANAGE_USERS
    )


def _actor_role_label(actor: User) -> str:
    return (
        actor.role.name
        if actor.role
        else "unknown"
    )


def _get_role_or_none(
    role_name: str,
) -> Role | None:
    if not role_name:
        return None

    return Role.query.filter_by(
        name=role_name
    ).first()


def _get_role_name(
    user: User | None,
) -> str | None:
    if not user or not user.role:
        return None

    return user.role.name


def _get_pagination_params():
    page = request.args.get(
        "page",
        1,
        type=int,
    )

    per_page = request.args.get(
        "per_page",
        DEFAULT_PAGE_SIZE,
        type=int,
    )

    page = max(
        page or 1,
        1,
    )

    per_page = min(
        max(
            per_page or DEFAULT_PAGE_SIZE,
            1,
        ),
        MAX_PAGE_SIZE,
    )

    return page, per_page


def _get_request_list_params():
    page, per_page = (
        _get_pagination_params()
    )

    status = request.args.get(
        "status",
        default=None,
        type=str,
    )

    sort = request.args.get(
        "sort",
        "desc",
        type=str,
    )

    search = request.args.get(
        "search",
        "",
        type=str,
    )

    search_field = request.args.get(
        "search_field",
        "",
        type=str,
    )

    status = (
        status.strip()
        if isinstance(status, str)
        else None
    )

    sort = str(
        sort or "desc"
    ).strip().lower()

    search = str(
        search or ""
    ).strip()

    search_field = str(
        search_field or ""
    ).strip().lower()

    if status == "":
        status = None

    if (
        status is not None
        and status
        not in VALID_REQUEST_STATUSES
    ):
        raise ValueError(
            "Недопустимый статус заявки"
        )

    if sort not in {
        "asc",
        "desc",
    }:
        raise ValueError(
            "sort должен быть asc или desc"
        )

    if search_field not in {
        "",
        "created_by",
        "assigned_to",
        "request_id",
    }:
        raise ValueError(
            "Недопустимое поле поиска"
        )

    return {
        "page": page,
        "per_page": per_page,
        "status": status,
        "sort": sort,
        "search": search,
        "search_field": search_field,
    }


def _apply_request_search(
    query,
    *,
    search,
    search_field,
    creator_alias,
):
    if not search:
        return query

    search_value = f"%{search}%"

    if search_field == "request_id":
        return query.filter(
            cast(
                Request.id,
                String,
            ).ilike(search_value)
        )

    if search_field == "created_by":
        return query.filter(
            or_(
                creator_alias.full_name.ilike(
                    search_value
                ),
                creator_alias.number.ilike(
                    search_value
                ),
            )
        )

    assigned_user_alias = aliased(
        User
    )

    query = (
        query
        .outerjoin(
            RequestItem,
            RequestItem.request_id
            == Request.id,
        )
        .outerjoin(
            assigned_user_alias,
            assigned_user_alias.id
            == RequestItem.assigned_to_id,
        )
    )

    if search_field == "assigned_to":
        return query.filter(
            or_(
                assigned_user_alias.full_name.ilike(
                    search_value
                ),
                assigned_user_alias.number.ilike(
                    search_value
                ),
            )
        ).distinct()

    return query.filter(
        or_(
            creator_alias.full_name.ilike(
                search_value
            ),
            creator_alias.number.ilike(
                search_value
            ),
            cast(
                Request.id,
                String,
            ).ilike(
                search_value
            ),
            assigned_user_alias.full_name.ilike(
                search_value
            ),
            assigned_user_alias.number.ilike(
                search_value
            ),
        )
    ).distinct()


def _apply_request_sort(
    query,
    sort,
):
    if sort == "asc":
        return query.order_by(
            Request.created_at.asc(),
            Request.id.asc(),
        )

    return query.order_by(
        Request.created_at.desc(),
        Request.id.desc(),
    )


def _serialize_request_pagination(
    pagination,
):
    return {
        "items": serialize_many(
            pagination.items,
            serialize_request,
        ),
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
        "next_page": (
            pagination.next_num
            if pagination.has_next
            else None
        ),
        "prev_page": (
            pagination.prev_num
            if pagination.has_prev
            else None
        ),
    }


@users_bp.get("/")
def list_users():
    users = AuthService.get_users()

    return jsonify(
        serialize_many(
            users,
            serialize_user,
        )
    )


@users_bp.post("/<int:user_id>/head")
def assign_head(user_id):
    actor = _get_actor()

    if (
        not actor
        or not actor.has_role("admin")
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    user = AuthService.get_user_by_id(
        user_id
    )

    if not user:
        return jsonify({
            "error": "User not found",
        }), 404

    current_role_name = (
        user.role.name
        if user.role
        else None
    )

    head_role_name = HEAD_ROLE_MAP.get(
        current_role_name
    )

    if not head_role_name:
        return jsonify({
            "error": (
                "Для текущей роли нельзя назначить "
                "роль начальника"
            )
        }), 400

    head_role = _get_role_or_none(
        head_role_name
    )

    if not head_role:
        return jsonify({
            "error": (
                f"Role '{head_role_name}' not found"
            )
        }), 500

    db.session.add(
        UserProfileHistory(
            target_user_id=user.id,
            changed_by_user_id=actor.id,
            change_type="role",
            changed_by_role=(
                _actor_role_label(actor)
            ),
            old_value=current_role_name,
            new_value=head_role.name,
        )
    )

    user.role = head_role

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(
        serialize_user(user)
    ), 200


@users_bp.delete("/<int:user_id>/head")
def remove_head(user_id):
    actor = _get_actor()

    if (
        not actor
        or not actor.has_role("admin")
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    user = AuthService.get_user_by_id(
        user_id
    )

    if not user:
        return jsonify({
            "error": "User not found",
        }), 404

    current_role_name = (
        user.role.name
        if user.role
        else None
    )

    base_role_name = (
        HEAD_TO_BASE_ROLE.get(
            current_role_name
        )
    )

    if not base_role_name:
        return jsonify({
            "error": (
                "Пользователь не является "
                "начальником"
            )
        }), 400

    base_role = _get_role_or_none(
        base_role_name
    )

    if not base_role:
        return jsonify({
            "error": (
                f"Role '{base_role_name}' not found"
            )
        }), 500

    db.session.add(
        UserProfileHistory(
            target_user_id=user.id,
            changed_by_user_id=actor.id,
            change_type="role",
            changed_by_role=(
                _actor_role_label(actor)
            ),
            old_value=current_role_name,
            new_value=base_role.name,
        )
    )

    user.role = base_role

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(
        serialize_user(user)
    ), 200


@users_bp.patch("/<int:user_id>/roles")
def update_user_role(user_id):
    data = request.get_json() or {}

    role_name = (
        data.get("role") or ""
    ).strip()

    if not role_name:
        return jsonify({
            "error": "role is required",
        }), 400

    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authorization required",
        }), 401

    is_admin = actor.has_role(
        "admin"
    )

    is_it_actor = (
        actor.has_role("it_department")
        or actor.has_role("it_head")
    )

    is_supply_head_actor = (
        actor.has_role("supply_head")
    )

    if not (
        is_admin
        or is_it_actor
        or is_supply_head_actor
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    if not is_admin:
        if role_name in _ADMIN_ONLY_ROLES:
            return jsonify({
                "error": (
                    "Нельзя назначить эту роль — "
                    "обратитесь к администратору"
                )
            }), 403

        if (
            is_it_actor
            and role_name in _SUPPLY_ROLES
        ):
            return jsonify({
                "error": (
                    "ОИТ не может назначать роли "
                    "отдела снабжения"
                )
            }), 403

        if (
            is_supply_head_actor
            and role_name in _IT_ROLES
        ):
            return jsonify({
                "error": (
                    "Отдел снабжения не может "
                    "назначать роли ОИТ"
                )
            }), 403

    target_user = (
        AuthService.get_user_by_id(
            user_id
        )
    )

    if not target_user:
        return jsonify({
            "error": "User not found",
        }), 404

    role = _get_role_or_none(
        role_name
    )

    if not role:
        return jsonify({
            "error": (
                f"Role '{role_name}' not found"
            )
        }), 400

    old_role_name = (
        target_user.role.name
        if target_user.role
        else None
    )

    if old_role_name == role.name:
        return jsonify({
            "error": (
                "У пользователя уже назначена "
                "эта роль"
            )
        }), 400

    db.session.add(
        UserProfileHistory(
            target_user_id=target_user.id,
            changed_by_user_id=actor.id,
            change_type="role",
            changed_by_role=(
                _actor_role_label(actor)
            ),
            old_value=old_role_name,
            new_value=role.name,
        )
    )

    target_user.role = role

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(
        serialize_user(target_user)
    ), 200


@users_bp.get("/me")
def get_current_user():
    user = _get_actor()

    if not user:
        return jsonify({
            "error": "Invalid token",
        }), 401

    return jsonify(
        serialize_user(user)
    ), 200


@users_bp.patch("/me")
def update_current_user():
    data = request.get_json() or {}

    new_full_name_raw = data.get(
        "full_name"
    )

    new_role_name_raw = data.get(
        "role_name"
    )

    new_number_raw = data.get(
        "number"
    )

    new_full_name = (
        new_full_name_raw.strip()
        if isinstance(
            new_full_name_raw,
            str,
        )
        else None
    )

    new_role_name = (
        new_role_name_raw.strip()
        if isinstance(
            new_role_name_raw,
            str,
        )
        else None
    )

    new_number = (
        new_number_raw.strip()
        if isinstance(
            new_number_raw,
            str,
        )
        else None
    )

    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Invalid token",
        }), 401

    current_full_name = (
        actor.full_name or ""
    ).strip()

    current_role_name = (
        actor.role.name
        if actor.role
        else ""
    )

    current_number = (
        actor.number or ""
    ).strip()

    has_full_name_change = (
        new_full_name is not None
        and new_full_name
        != current_full_name
    )

    has_role_change = (
        bool(new_role_name)
        and new_role_name
        != current_role_name
    )

    has_number_change = (
        new_number is not None
        and new_number
        != current_number
    )

    if not any((
        has_full_name_change,
        has_role_change,
        has_number_change,
    )):
        return jsonify({
            "error": (
                "Нет изменений для сохранения"
            )
        }), 400

    if has_full_name_change:
        if not new_full_name:
            return jsonify({
                "error": (
                    "full_name cannot be empty"
                )
            }), 400

        db.session.add(
            UserProfileHistory(
                target_user_id=actor.id,
                changed_by_user_id=actor.id,
                change_type="name",
                changed_by_role="self",
                old_full_name=actor.full_name,
                new_full_name=new_full_name,
                old_value=actor.full_name,
                new_value=new_full_name,
            )
        )

        actor.full_name = new_full_name

        increment_stat(
            actor.id,
            "name_changes",
        )

    if has_number_change:
        if not new_number:
            return jsonify({
                "error": (
                    "number cannot be empty"
                )
            }), 400

        existing_user = User.query.filter(
            User.number == new_number,
            User.id != actor.id,
        ).first()

        if existing_user:
            return jsonify({
                "error": (
                    "Пользователь с таким номером "
                    "уже существует"
                )
            }), 400

        db.session.add(
            UserProfileHistory(
                target_user_id=actor.id,
                changed_by_user_id=actor.id,
                change_type="phone",
                changed_by_role="self",
                old_value=actor.number,
                new_value=new_number,
            )
        )

        actor.number = new_number

        increment_stat(
            actor.id,
            "phone_changes",
        )

    if has_role_change:
        if (
            new_role_name
            in _ADMIN_ONLY_ROLES
        ):
            return jsonify({
                "error": (
                    "Нельзя самостоятельно назначить "
                    "себе эту роль"
                )
            }), 400

        from routes.role_requests import (
            REQUIRES_APPROVAL,
        )

        if (
            new_role_name
            in REQUIRES_APPROVAL
        ):
            return jsonify({
                "error": (
                    "Для этой роли требуется одобрение "
                    "начальника. Используйте кнопку "
                    "«Запросить роль»."
                )
            }), 400

        role = _get_role_or_none(
            new_role_name
        )

        if not role:
            return jsonify({
                "error": (
                    f"Role '{new_role_name}' "
                    "not found"
                )
            }), 400

        db.session.add(
            UserProfileHistory(
                target_user_id=actor.id,
                changed_by_user_id=actor.id,
                change_type="role",
                changed_by_role="self",
                old_value=(
                    current_role_name or None
                ),
                new_value=role.name,
            )
        )

        actor.role = role

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(
        serialize_user(actor)
    ), 200


@users_bp.get("/profile-history")
def get_profile_history():
    actor = _get_actor()

    allowed_roles = {
        "admin",
        "supply_manager",
        "supply_head",
        "rezo_department",
        "rezo_head",
        "it_department",
        "it_head",
    }

    if (
        not actor
        or not any(
            actor.has_role(role_name)
            for role_name in allowed_roles
        )
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    number = request.args.get(
        "number",
        "",
    ).strip()

    full_name = request.args.get(
        "full_name",
        "",
    ).strip()

    date_value = request.args.get(
        "date",
        "",
    ).strip()

    sort = request.args.get(
        "sort",
        "desc",
    ).strip().lower()

    query = db.session.query(
        UserProfileHistory,
        User.number.label(
            "target_number"
        ),
        User.full_name.label(
            "target_full_name"
        ),
    ).outerjoin(
        User,
        User.id
        == UserProfileHistory.target_user_id,
    )

    if number:
        query = query.filter(
            or_(
                User.number.ilike(
                    f"%{number}%"
                ),
                UserProfileHistory.old_value.ilike(
                    f"%{number}%"
                ),
            )
        )

    if full_name:
        query = query.filter(
            or_(
                UserProfileHistory.old_full_name.ilike(
                    f"%{full_name}%"
                ),
                UserProfileHistory.new_full_name.ilike(
                    f"%{full_name}%"
                ),
                UserProfileHistory.old_value.ilike(
                    f"%{full_name}%"
                ),
                UserProfileHistory.new_value.ilike(
                    f"%{full_name}%"
                ),
            )
        )

    if date_value:
        try:
            exact_date = datetime.strptime(
                date_value,
                "%Y-%m-%d",
            )

            next_day = (
                exact_date
                + timedelta(days=1)
            )

            query = query.filter(
                UserProfileHistory.changed_at
                >= exact_date,
                UserProfileHistory.changed_at
                < next_day,
            )

        except ValueError:
            return jsonify({
                "error": (
                    "Invalid date format. "
                    "Use YYYY-MM-DD"
                )
            }), 400

    if sort == "asc":
        query = query.order_by(
            UserProfileHistory.changed_at.asc()
        )
    else:
        query = query.order_by(
            UserProfileHistory.changed_at.desc()
        )

    rows = query.all()

    result = []

    for (
        history,
        target_number,
        target_full_name,
    ) in rows:
        changed_by_user = (
            AuthService.get_user_by_id(
                history.changed_by_user_id
            )
            if history.changed_by_user_id
            else None
        )

        if (
            not target_number
            and history.change_type
            == "deletion"
            and history.old_value
        ):
            parts = history.old_value.split(
                " | ",
                1,
            )

            target_number = (
                parts[0].strip()
                if parts
                else None
            )

            target_full_name = (
                parts[1].strip()
                if len(parts) > 1
                else None
            )

        result.append({
            "id": history.id,
            "target_user_id": (
                history.target_user_id
            ),
            "target_number": target_number,
            "target_full_name": (
                target_full_name
            ),
            "changed_by_user_id": (
                history.changed_by_user_id
            ),
            "changed_by_number": (
                changed_by_user.number
                if changed_by_user
                else None
            ),
            "changed_by_name": (
                changed_by_user.full_name
                if changed_by_user
                else None
            ),
            "change_type": (
                history.change_type
                or "name"
            ),
            "changed_by_role": (
                history.changed_by_role
            ),
            "old_full_name": (
                history.old_full_name
            ),
            "new_full_name": (
                history.new_full_name
            ),
            "old_value": (
                history.old_value
            ),
            "new_value": (
                history.new_value
            ),
            "changed_at": (
                history.changed_at.isoformat()
                if history.changed_at
                else None
            ),
            "changed_at_formatted": (
                format_datetime_ekb(
                    history.changed_at
                )
            ),
        })

    return jsonify(result), 200


@users_bp.get("/me/requests")
def get_my_requests():
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Invalid token",
        }), 401

    try:
        params = (
            _get_request_list_params()
        )
    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    creator_alias = aliased(
        User
    )

    query = (
        Request.query
        .join(
            creator_alias,
            creator_alias.id
            == Request.created_by_id,
        )
        .filter(
            Request.created_by_id
            == actor.id,
        )
    )

    if params["status"]:
        query = query.filter(
            Request.status
            == params["status"]
        )

    query = _apply_request_search(
        query,
        search=params["search"],
        search_field=(
            params["search_field"]
        ),
        creator_alias=creator_alias,
    )

    query = _apply_request_sort(
        query,
        params["sort"],
    )

    pagination = query.paginate(
        page=params["page"],
        per_page=params["per_page"],
        error_out=False,
    )

    return jsonify(
        _serialize_request_pagination(
            pagination
        )
    ), 200


@users_bp.get(
    "/me/department/requests"
)
def get_all_department_requests():
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Invalid token",
        }), 401

    actor_role_name = _get_role_name(
        actor
    )

    if not actor_role_name:
        return jsonify({
            "error": (
                "У пользователя не назначена роль"
            )
        }), 400

    try:
        params = (
            _get_request_list_params()
        )
    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    creator_alias = aliased(
        User
    )

    creator_role_alias = aliased(
        Role
    )

    query = (
        Request.query
        .join(
            creator_alias,
            creator_alias.id
            == Request.created_by_id,
        )
        .join(
            creator_role_alias,
            creator_role_alias.id
            == creator_alias.role_id,
        )
    )

    if actor_role_name == "admin":
        pass
    else:
        department_roles = (
            DEPARTMENT_ROLE_GROUPS.get(
                actor_role_name,
                {actor_role_name},
            )
        )

        query = query.filter(
            creator_role_alias.name.in_(
                department_roles
            )
        )

    if params["status"]:
        query = query.filter(
            Request.status
            == params["status"]
        )

    query = _apply_request_search(
        query,
        search=params["search"],
        search_field=(
            params["search_field"]
        ),
        creator_alias=creator_alias,
    )

    query = _apply_request_sort(
        query,
        params["sort"],
    )

    pagination = query.paginate(
        page=params["page"],
        per_page=params["per_page"],
        error_out=False,
    )

    return jsonify(
        _serialize_request_pagination(
            pagination
        )
    ), 200


@users_bp.patch("/<int:user_id>")
def update_user(user_id):
    actor = _get_actor()

    if (
        not actor
        or not _can_manage(actor)
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    user = AuthService.get_user_by_id(
        user_id
    )

    if not user:
        return jsonify({
            "error": "User not found",
        }), 404

    data = request.get_json() or {}

    new_full_name = (
        data.get("full_name") or ""
    ).strip()

    new_number = (
        data.get("number") or ""
    ).strip()

    new_password = (
        data.get("password") or ""
    ).strip()

    changed = False

    actor_role = _actor_role_label(
        actor
    )

    if (
        new_full_name
        and new_full_name
        != (
            user.full_name or ""
        ).strip()
    ):
        db.session.add(
            UserProfileHistory(
                target_user_id=user.id,
                changed_by_user_id=actor.id,
                change_type="name",
                changed_by_role=actor_role,
                old_full_name=user.full_name,
                new_full_name=new_full_name,
                old_value=user.full_name,
                new_value=new_full_name,
            )
        )

        user.full_name = new_full_name
        changed = True

    if (
        new_number
        and new_number
        != (
            user.number or ""
        ).strip()
    ):
        existing = User.query.filter(
            User.number == new_number,
            User.id != user_id,
        ).first()

        if existing:
            return jsonify({
                "error": (
                    "Пользователь с таким номером "
                    "уже существует"
                )
            }), 400

        db.session.add(
            UserProfileHistory(
                target_user_id=user.id,
                changed_by_user_id=actor.id,
                change_type="phone",
                changed_by_role=actor_role,
                old_value=user.number,
                new_value=new_number,
            )
        )

        user.number = new_number
        changed = True

    if new_password:
        user.set_password(
            new_password
        )

        db.session.add(
            UserProfileHistory(
                target_user_id=user.id,
                changed_by_user_id=actor.id,
                change_type="password",
                changed_by_role=actor_role,
            )
        )

        changed = True

    if not changed:
        return jsonify({
            "error": (
                "Нет изменений для сохранения"
            )
        }), 400

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(
        serialize_user(user)
    ), 200


@users_bp.delete("/<int:user_id>")
def delete_user(user_id):
    actor = _get_actor()

    if (
        not actor
        or not _can_manage(actor)
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    if actor.id == user_id:
        return jsonify({
            "error": (
                "Нельзя удалить собственный "
                "аккаунт"
            )
        }), 400

    user = AuthService.get_user_by_id(
        user_id
    )

    if not user:
        return jsonify({
            "error": "User not found",
        }), 404

    protected_roles = {
        "admin",
        "supply_head",
        "rezo_head",
        "it_head",
    }

    if (
        not actor.has_role("admin")
        and user.role
        and user.role.name
        in protected_roles
    ):
        return jsonify({
            "error": (
                "Недостаточно прав для удаления "
                "этого аккаунта"
            )
        }), 403

    uid = user.id

    deleted_user_number = (
        user.number or "—"
    )

    deleted_user_name = (
        user.full_name or "—"
    )

    try:
        from sqlalchemy import (
            inspect as sa_inspect,
        )

        deletion_log = (
            UserProfileHistory(
                target_user_id=uid,
                changed_by_user_id=actor.id,
                change_type="deletion",
                changed_by_role=(
                    _actor_role_label(actor)
                ),
                old_value=(
                    f"{deleted_user_number} | "
                    f"{deleted_user_name}"
                ),
            )
        )

        db.session.add(
            deletion_log
        )

        db.session.flush()

        inspector = sa_inspect(
            db.engine
        )

        requests_fks = (
            inspector.get_foreign_keys(
                "requests"
            )
        )

        for fk in requests_fks:
            if (
                fk["referred_table"]
                == "users"
                and fk[
                    "constrained_columns"
                ]
            ):
                column_name = (
                    fk[
                        "constrained_columns"
                    ][0]
                )

                db.session.execute(
                    text(
                        f"""
                        UPDATE requests
                        SET {column_name} = NULL
                        WHERE {column_name} = :uid
                        """
                    ),
                    {
                        "uid": uid,
                    },
                )

        db.session.execute(
            text("""
                UPDATE request_status_history
                SET changed_by_id = NULL
                WHERE changed_by_id = :uid
            """),
            {
                "uid": uid,
            },
        )

        db.session.execute(
            text("""
                DELETE FROM user_profile_history
                WHERE target_user_id = :uid
                  AND change_type
                      IS DISTINCT FROM 'deletion'
            """),
            {
                "uid": uid,
            },
        )

        db.session.execute(
            text("""
                UPDATE user_profile_history
                SET changed_by_user_id = NULL
                WHERE changed_by_user_id = :uid
            """),
            {
                "uid": uid,
            },
        )

        db.session.delete(
            user
        )

        db.session.commit()

    except Exception:
        db.session.rollback()
        raise

    return jsonify({
        "message": "Пользователь удалён",
    }), 200
