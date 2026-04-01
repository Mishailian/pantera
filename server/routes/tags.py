from flask import Blueprint, request, jsonify
from app.services.storage_service import StorageService
from app.utils.serializers import serialize_tag, serialize_many

tags_bp = Blueprint("tags", __name__, url_prefix="/api/v1/tags")

@tags_bp.route("/")
def list_tags():
    tags = StorageService.get_tags()
    return jsonify(serialize_many(tags, serialize_tag))

@tags_bp.route("/<int:tag_id>")
def get_tag(tag_id):
    tag = StorageService.get_tag_by_id(tag_id)
    if not tag:
        return jsonify({"error": "Tag not found"}), 404
    return jsonify(serialize_tag(tag))
