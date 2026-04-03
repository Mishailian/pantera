from flask import Blueprint, request, jsonify
from services.storage_service import StorageService
from services.auth_service import AuthService
from utils.serializers import (
    serialize_temporary_storage, serialize_undeclared_storage, 
    serialize_archive, serialize_tag, serialize_executor,
    serialize_many
)

temporary_storage_bp = Blueprint("temporary_storage", __name__)

@temporary_storage_bp.get("/")
def list_temporary_storages():
    """Список temporary_storage с пагинацией"""
    page = request.args.get("page", 0, type=int)
    storages = StorageService.get_temporary_storages(page)
    return jsonify(serialize_many(storages, serialize_temporary_storage))

@temporary_storage_bp.get("/<int:storage_id>")
def get_temporary_storage(storage_id):
    """Получить temporary_storage по ID"""
    storage = StorageService.get_temporary_storage_by_id(storage_id)
    if not storage:
        return jsonify({"error": "Storage not found"}), 404
    return jsonify(serialize_temporary_storage(storage))

@temporary_storage_bp.post("/")
def create_temporary_storage():
    """Создать temporary_storage"""
    data = request.get_json() or {}
    try:
        storage = StorageService.create_temporary_storage(
            data.get("name"),
            data.get("price_id"),
            data.get("tags", [])
        )
        return jsonify(serialize_temporary_storage(storage)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@temporary_storage_bp.put("/<int:storage_id>")
def update_temporary_storage(storage_id):
    """Обновить temporary_storage"""
    data = request.get_json() or {}
    storage = StorageService.update_temporary_storage(storage_id, **data)
    if not storage:
        return jsonify({"error": "Storage not found"}), 404
    return jsonify(serialize_temporary_storage(storage))

@temporary_storage_bp.delete("/<int:storage_id>")
def delete_temporary_storage(storage_id):
    """Удалить temporary_storage"""
    storage = StorageService.get_temporary_storage_by_id(storage_id)
    if not storage:
        return jsonify({"error": "Storage not found"}), 404
    
    db.session.delete(storage)
    db.session.commit()
    return jsonify({"message": "Storage deleted successfully"}), 200

@temporary_storage_bp.route("/store/")
def list_store_django():
    """Старый Django путь /api/v1/store/"""
    return list_temporary_storages()

@temporary_storage_bp.route("/store/<int:storage_id>")
def get_store_django(storage_id):
    """Старый Django путь /api/v1/store/<id>/"""
    return get_temporary_storage(storage_id)
