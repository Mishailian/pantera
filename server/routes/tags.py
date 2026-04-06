from flask import Blueprint, request, jsonify

from services.tag_service import TagService
from utils.serializers import serialize_many, serialize_tag

tags_bp = Blueprint("tags", __name__, url_prefix="/api/v1/tags")


@tags_bp.get("/")
def list_tags():
    tags = TagService.get_tags()
    return jsonify(serialize_many(tags, serialize_tag))


@tags_bp.get("/<int:tag_id>")
def get_tag(tag_id):
    tag = TagService.get_tag_by_id(tag_id)
    if not tag:
        return jsonify({"error": "Tag not found"}), 404

    return jsonify(serialize_tag(tag))


@tags_bp.post("/")
def create_tag():
    data = request.get_json() or {}

    try:
        tag = TagService.create_tag(data.get("name"))
        return jsonify(serialize_tag(tag)), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@tags_bp.patch("/<int:tag_id>")
def update_tag(tag_id):
    data = request.get_json() or {}

    try:
        tag = TagService.update_tag(tag_id, data.get("name"))
        if not tag:
            return jsonify({"error": "Tag not found"}), 404

        return jsonify(serialize_tag(tag))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@tags_bp.delete("/<int:tag_id>")
def delete_tag(tag_id):
    deleted = TagService.delete_tag(tag_id)
    if not deleted:
        return jsonify({"error": "Tag not found"}), 404

    return jsonify({"message": "Tag deleted successfully"}), 200
