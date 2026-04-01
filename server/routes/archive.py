from flask import Blueprint, request, jsonify
from services.storage_service import StorageService
from utils.serializers import serialize_archive, serialize_many

archive_bp = Blueprint("archive", __name__)

@archive_bp.get("/")
def list_archives():
    """Список архивных записей"""
    page = request.args.get("page", 0, type=int)
    archives = StorageService.get_archive_items(page)
    return jsonify(serialize_many(archives, serialize_archive))

@archive_bp.get("/<int:archive_id>")
def get_archive(archive_id):
    """Получить архивную запись по ID"""
    archive = StorageService.get_archive_items_by_id(archive_id)  # TODO: добавить метод в service
    if not archive:
        return jsonify({"error": "Archive not found"}), 404
    return jsonify(serialize_archive(archive))
