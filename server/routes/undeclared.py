from flask import Blueprint, request, jsonify
from app.services.storage_service import StorageService
from app.utils.serializers import serialize_undeclared_storage, serialize_many

undeclared_bp = Blueprint("undeclared", __name__, url_prefix="/api/v1/undeclared")

@undeclared_bp.route("/")
def list_undeclared():
    page = request.args.get("page", 0, type=int)
    storages = StorageService.get_undeclared_storages(page)
    return jsonify(serialize_many(storages, serialize_undeclared_storage))

@undeclared_bp.route("/<int:storage_id>")
def get_undeclared(storage_id):
    # TODO: реализация
    return jsonify({"error": "Not implemented"}), 501
