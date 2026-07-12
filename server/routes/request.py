from flask import Blueprint, request, jsonify

from services.request_service import RequestService
from utils.serializers import serialize_many, serialize_request, serialize_request_item, serialize_deleted_request

requests_bp = Blueprint("requests", __name__)


@requests_bp.get("/")
def list_requests():
    page = request.args.get("page", 0, type=int)
    status = request.args.get("status", default=None, type=str)
    count_only = request.args.get("count", 0, type=int)

    sort = request.args.get("sort", "desc", type=str)

    if count_only:
        total = RequestService.get_requests_count(status=status)
        return jsonify({"count": total})

    requests_list = RequestService.get_requests(page=page, status=status, sort=sort)
    total = RequestService.get_requests_count(status=status)

    return jsonify({
        "items": serialize_many(requests_list, serialize_request),
        "total": total,
        "page": page,
        "per_page": RequestService.ITEMS_PER_PAGE,
    })



@requests_bp.get("/<int:request_id>")
def get_request(request_id):
    request_obj = RequestService.get_request_by_id(request_id)
    if not request_obj:
        return jsonify({"error": "Request not found"}), 404

    return jsonify(serialize_request(request_obj))


@requests_bp.post("/")
def create_request():
    data = request.get_json() or {}

    items = data.get("items", [])
    comment = data.get("comment")
    created_by_id = data.get("created_by_id")

    try:
        request_obj = RequestService.create_request(
            items=items,
            comment=comment,
            created_by_id=created_by_id,
        )
        return jsonify(serialize_request(request_obj)), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@requests_bp.patch("/<int:request_id>")
def update_request(request_id):
    data = request.get_json() or {}

    try:
        request_obj = RequestService.update_request(request_id, **data)
        if not request_obj:
            return jsonify({"error": "Request not found"}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(serialize_request(request_obj))


@requests_bp.patch("/<int:request_id>/status")
def change_request_status(request_id):
    data = request.get_json() or {}

    new_status = data.get("status")
    changed_by_id = data.get("changed_by_id")
    comment = data.get("comment")

    if not new_status:
        return jsonify({"error": "status is required"}), 400

    try:
        request_obj = RequestService.change_status(
            request_id=request_id,
            new_status=new_status,
            changed_by_id=changed_by_id,
            comment=comment,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not request_obj:
        return jsonify({"error": "Request not found"}), 404

    return jsonify(serialize_request(request_obj))


@requests_bp.patch("/items/<int:item_id>")
def update_request_item(item_id):
    data = request.get_json() or {}

    item = RequestService.update_request_item(item_id, **data)
    if not item:
        return jsonify({"error": "Request item not found"}), 404

    return jsonify(serialize_request_item(item))



@requests_bp.get("/deleted/")
def list_deleted_requests():
    from services.auth_service import AuthService
    token = request.headers.get("Authorization", "").replace("Token ", "").strip()
    actor = AuthService.get_user_by_token(token)
    if not actor or not actor.has_role("admin"):
        return jsonify({"error": "Access denied"}), 403

    records = RequestService.get_deleted_requests()
    return jsonify([serialize_deleted_request(r) for r in records])


@requests_bp.delete("/<int:request_id>")
def delete_request(request_id):
    data = request.get_json() or {}
    deleted_by_id = data.get("deleted_by_id")
    reason = data.get("reason")

    deleted = RequestService.delete_request(request_id, deleted_by_id=deleted_by_id, reason=reason)
    if not deleted:
        return jsonify({"error": "Request not found"}), 404

    return jsonify({"message": "Request deleted successfully"}), 200