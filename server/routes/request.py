from flask import Blueprint, jsonify, request
from sqlalchemy import String, cast, exists, or_
from sqlalchemy.orm import aliased

from extensions import db
from models.request.request import Request
from models.request.requestItem import RequestItem
from models.user.user import User
from services.request_service import RequestService
from utils.serializers import (
    serialize_deleted_request,
    serialize_many,
    serialize_request,
    serialize_request_item,
)


requests_bp = Blueprint(
    "requests",
    __name__,
)


_SUPPLY_ROLES = {
    "supply_manager",
    "supply_head",
}


_REZO_ROLES = {
    "rezo_department",
    "rezo_head",
}


_ALL_DEPARTMENT_ROLES = {
    "admin",
    "it_department",
    "it_head",
}


_VALID_STATUSES = {
    "active",
    "undeclared",
    "archived",
}


_VALID_SEARCH_FIELDS = {
    "",
    "created_by",
    "assigned_to",
    "request_id",
}


_DEFAULT_PAGE_SIZE = 15
_MAX_PAGE_SIZE = 100


def _get_actor():
    from services.auth_service import AuthService

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


def _get_role_name(user):
    if not user or not user.role:
        return None

    return user.role.name


def _department_for_user(user):
    """
    Возвращает отдел, которым ограничен пользователь.

    None:
        пользователь может просматривать разные отделы.

    supply/rezo:
        пользователь ограничен своим отделом.
    """

    role_name = _get_role_name(
        user
    )

    if not role_name:
        return None

    if role_name in _ALL_DEPARTMENT_ROLES:
        return None

    if role_name in _SUPPLY_ROLES:
        return "supply"

    if role_name in _REZO_ROLES:
        return "rezo"

    return None


def _serialize_pagination(
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


@requests_bp.get("/")
def list_requests():
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    page = request.args.get(
        "page",
        default=1,
        type=int,
    )

    per_page = request.args.get(
        "per_page",
        default=_DEFAULT_PAGE_SIZE,
        type=int,
    )

    status = request.args.get(
        "status",
        default=None,
        type=str,
    )

    sort = request.args.get(
        "sort",
        default="desc",
        type=str,
    )

    requested_department = request.args.get(
        "department",
        default=None,
        type=str,
    )

    assigned_to_id = request.args.get(
        "assigned_to_id",
        default=None,
        type=int,
    )

    search = request.args.get(
        "search",
        default="",
        type=str,
    )

    search_field = request.args.get(
        "search_field",
        default="",
        type=str,
    )

    count_only = request.args.get(
        "count",
        default=0,
        type=int,
    )

    page = max(
        page or 1,
        1,
    )

    per_page = min(
        max(
            per_page or _DEFAULT_PAGE_SIZE,
            1,
        ),
        _MAX_PAGE_SIZE,
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

    if status:
        status = status.strip()

        if status not in _VALID_STATUSES:
            return jsonify({
                "error": "Invalid request status",
            }), 400

    if sort not in {
        "asc",
        "desc",
    }:
        return jsonify({
            "error": "sort must be asc or desc",
        }), 400

    if search_field not in _VALID_SEARCH_FIELDS:
        return jsonify({
            "error": "Invalid search field",
        }), 400

    actor_department = _department_for_user(
        actor
    )

    if actor_department:
        department = actor_department
    else:
        department = requested_department

    if department not in {
        None,
        "",
        "supply",
        "rezo",
    }:
        return jsonify({
            "error": "Invalid department",
        }), 400

    creator_alias = aliased(
        User
    )

    query = (
        Request.query
        .outerjoin(
            creator_alias,
            creator_alias.id
            == Request.created_by_id,
        )
    )

    if status:
        query = query.filter(
            Request.status == status
        )

    if department:
        query = query.filter(
            Request.department == department
        )

    # Фильтр по ответственному.
    # Ответственный хранится у позиции заявки:
    # RequestItem.assigned_to_id.
    if assigned_to_id is not None:
        selected_assignee = db.session.get(
            User,
            assigned_to_id,
        )

        if selected_assignee is None:
            return jsonify({
                "error": "Selected assignee not found",
            }), 404

        assigned_exists = (
            exists()
            .where(
                RequestItem.request_id
                == Request.id
            )
            .where(
                RequestItem.assigned_to_id
                == assigned_to_id
            )
        )

        query = query.filter(
            assigned_exists
        )

    if search:
        search_value = f"%{search}%"

        if search_field == "request_id":
            query = query.filter(
                cast(
                    Request.id,
                    String,
                ).ilike(
                    search_value
                )
            )

        elif search_field == "created_by":
            query = query.filter(
                or_(
                    creator_alias.full_name.ilike(
                        search_value
                    ),
                    creator_alias.number.ilike(
                        search_value
                    ),
                )
            )

        elif search_field == "assigned_to":
            assigned_search_exists = (
                exists()
                .where(
                    RequestItem.request_id
                    == Request.id
                )
                .where(
                    RequestItem.assigned_to_id
                    == User.id
                )
                .where(
                    or_(
                        User.full_name.ilike(
                            search_value
                        ),
                        User.number.ilike(
                            search_value
                        ),
                    )
                )
            )

            query = query.filter(
                assigned_search_exists
            )

        else:
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
                .filter(
                    or_(
                        cast(
                            Request.id,
                            String,
                        ).ilike(
                            search_value
                        ),
                        creator_alias.full_name.ilike(
                            search_value
                        ),
                        creator_alias.number.ilike(
                            search_value
                        ),
                        assigned_user_alias.full_name.ilike(
                            search_value
                        ),
                        assigned_user_alias.number.ilike(
                            search_value
                        ),
                    )
                )
                .distinct()
            )

    if sort == "asc":
        query = query.order_by(
            Request.created_at.asc(),
            Request.id.asc(),
        )
    else:
        query = query.order_by(
            Request.created_at.desc(),
            Request.id.desc(),
        )

    if count_only:
        return jsonify({
            "count": query.count(),
        }), 200

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return jsonify(
        _serialize_pagination(
            pagination
        )
    ), 200


@requests_bp.get(
    "/<int:request_id>"
)
def get_request(request_id):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    request_obj = (
        RequestService
        .get_request_by_id(
            request_id
        )
    )

    if not request_obj:
        return jsonify({
            "error": "Request not found",
        }), 404

    department = _department_for_user(
        actor
    )

    if (
        department is not None
        and request_obj.department
        != department
        and not (
            RequestService
            .can_user_read_request(
                actor,
                request_obj,
            )
        )
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    return jsonify(
        serialize_request(
            request_obj
        )
    ), 200


@requests_bp.post("/")
def create_request():
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    data = request.get_json() or {}

    items = data.get(
        "items",
        [],
    )

    comment = data.get(
        "comment"
    )

    department = data.get(
        "department",
        "supply",
    )

    try:
        request_obj = (
            RequestService
            .create_request(
                items=items,
                comment=comment,
                created_by_id=actor.id,
                department=department,
            )
        )

        return jsonify(
            serialize_request(
                request_obj
            )
        ), 201

    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400


@requests_bp.patch(
    "/<int:request_id>"
)
def update_request(request_id):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    data = request.get_json() or {}

    try:
        request_obj = (
            RequestService
            .update_request(
                request_id,
                actor=actor,
                **data,
            )
        )

    except PermissionError as error:
        return jsonify({
            "error": str(error),
        }), 403

    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    if not request_obj:
        return jsonify({
            "error": "Request not found",
        }), 404

    return jsonify(
        serialize_request(
            request_obj
        )
    ), 200


@requests_bp.patch(
    "/<int:request_id>/status"
)
def change_request_status(
    request_id,
):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    data = request.get_json() or {}

    new_status = data.get(
        "status"
    )

    comment = data.get(
        "comment"
    )

    if not new_status:
        return jsonify({
            "error": "status is required",
        }), 400

    try:
        request_obj = (
            RequestService
            .change_status(
                request_id=request_id,
                new_status=new_status,
                changed_by_id=actor.id,
                comment=comment,
                actor=actor,
            )
        )

    except PermissionError as error:
        return jsonify({
            "error": str(error),
        }), 403

    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    if not request_obj:
        return jsonify({
            "error": "Request not found",
        }), 404

    return jsonify(
        serialize_request(
            request_obj
        )
    ), 200


@requests_bp.patch(
    "/items/<int:item_id>"
)
def update_request_item(
    item_id,
):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    data = request.get_json() or {}

    try:
        item = (
            RequestService
            .update_request_item(
                item_id,
                actor=actor,
                **data,
            )
        )

    except PermissionError as error:
        return jsonify({
            "error": str(error),
        }), 403

    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    if not item:
        return jsonify({
            "error": "Request item not found",
        }), 404

    return jsonify(
        serialize_request_item(
            item
        )
    ), 200


@requests_bp.post(
    "/<int:request_id>/items"
)
def add_request_item(
    request_id,
):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    data = request.get_json() or {}

    try:
        item = (
            RequestService
            .add_request_item(
                request_id=request_id,
                actor=actor,
                name=data.get("name"),
                unit=data.get("unit"),
                quantity=data.get(
                    "quantity"
                ),
                description=data.get(
                    "description"
                ),
                deadline=data.get(
                    "deadline"
                ),
            )
        )

    except PermissionError as error:
        return jsonify({
            "error": str(error),
        }), 403

    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    if not item:
        return jsonify({
            "error": "Request not found",
        }), 404

    return jsonify(
        serialize_request_item(
            item
        )
    ), 201


@requests_bp.delete(
    "/items/<int:item_id>"
)
def delete_request_item(
    item_id,
):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    try:
        deleted = (
            RequestService
            .delete_request_item(
                item_id,
                actor=actor,
            )
        )

    except PermissionError as error:
        return jsonify({
            "error": str(error),
        }), 403

    if not deleted:
        return jsonify({
            "error": "Request item not found",
        }), 404

    return jsonify({
        "message":
            "Request item deleted successfully",
    }), 200


@requests_bp.get(
    "/deleted/"
)
def list_deleted_requests():
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    if not actor.has_role(
        "admin"
    ):
        return jsonify({
            "error": "Access denied",
        }), 403

    records = (
        RequestService
        .get_deleted_requests()
    )

    return jsonify([
        serialize_deleted_request(
            record
        )
        for record in records
    ]), 200


@requests_bp.delete(
    "/<int:request_id>"
)
def delete_request(request_id):
    actor = _get_actor()

    if not actor:
        return jsonify({
            "error": "Authentication required",
        }), 401

    data = request.get_json() or {}

    reason = data.get(
        "reason"
    )

    try:
        deleted = (
            RequestService
            .delete_request(
                request_id=request_id,
                deleted_by_id=actor.id,
                reason=reason,
                actor=actor,
            )
        )

    except PermissionError as error:
        return jsonify({
            "error": str(error),
        }), 403

    if not deleted:
        return jsonify({
            "error": "Request not found",
        }), 404

    return jsonify({
        "message":
            "Request deleted successfully",
    }), 200
