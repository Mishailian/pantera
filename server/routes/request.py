from flask import Blueprint, request, jsonify

from services.request_service import RequestService
from utils.serializers import serialize_many, serialize_request, serialize_request_item

requests_bp = Blueprint("requests", __name__)


@requests_bp.get("/")
def list_requests():
    page = request.args.get("page", 0, type=int)
    status = request.args.get("status", default=None, type=str)

    requests_list = RequestService.get_requests(page=page, status=status)
    return jsonify(serialize_many(requests_list, serialize_request))


@requests_bp.get("/health")
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Flask backend is running",
        "version": "1.0.0"
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
    on_behalf_role_id = data.get("on_behalf_role_id")

    try:
        request_obj = RequestService.create_request(
            items=items,
            comment=comment,
            created_by_id=created_by_id,
            on_behalf_role_id=on_behalf_role_id,
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


@requests_bp.post("/<int:request_id>/items")
def add_request_item(request_id):
    data = request.get_json() or {}

    name = data.get("name")
    unit = data.get("unit")
    quantity = data.get("quantity")
    description = data.get("description")
    deadline = data.get("deadline")

    if not name or not unit or quantity is None:
        return jsonify({"error": "name, unit and quantity are required"}), 400

    item = RequestService.add_request_item(
        request_id=request_id,
        name=name,
        unit=unit,
        quantity=quantity,
        description=description,
        deadline=deadline,
    )

    if not item:
        return jsonify({"error": "Request not found"}), 404

    return jsonify(serialize_request_item(item)), 201

@requests_bp.patch("/items/<int:item_id>")
def update_request_item(item_id):
    data = request.get_json() or {}

    item = RequestService.update_request_item(item_id, **data)
    if not item:
        return jsonify({"error": "Request item not found"}), 404

    return jsonify(serialize_request_item(item))


@requests_bp.delete("/items/<int:item_id>")
def delete_request_item(item_id):
    deleted = RequestService.delete_request_item(item_id)
    if not deleted:
        return jsonify({"error": "Request item not found"}), 404

    return jsonify({"message": "Request item deleted successfully"}), 200


@requests_bp.delete("/<int:request_id>")
def delete_request(request_id):
    deleted = RequestService.delete_request(request_id)
    if not deleted:
        return jsonify({"error": "Request not found"}), 404

    return jsonify({"message": "Request deleted successfully"}), 200