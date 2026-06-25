from flask import Blueprint, request, jsonify

from extensions import db
from models.request.requestTemplate import RequestTemplate
from services.auth_service import AuthService
from utils.serializers import serialize_many, serialize_request_template

templates_bp = Blueprint("templates", __name__, url_prefix="/api/v1/templates")


def _get_actor():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Token "):
        return None
    token = auth_header.replace("Token ", "").strip()
    if not token:
        return None
    return AuthService.get_user_by_token(token)


@templates_bp.get("/")
def list_templates():
    actor = _get_actor()
    if not actor:
        return jsonify({"error": "Authorization required"}), 401

    templates = (
        RequestTemplate.query
        .filter_by(user_id=actor.id)
        .order_by(RequestTemplate.created_at.desc())
        .all()
    )
    return jsonify(serialize_many(templates, serialize_request_template)), 200


@templates_bp.post("/")
def create_template():
    actor = _get_actor()
    if not actor:
        return jsonify({"error": "Authorization required"}), 401

    data = request.get_json() or {}
    items = data.get("items") or []
    comment = data.get("comment") or ""
    signers = data.get("signers") or []

    if not isinstance(items, list):
        return jsonify({"error": "items must be a list"}), 400

    valid_items = [
        item for item in items
        if item.get("name") and item.get("unit") and float(item.get("quantity") or 0) > 0
    ]

    if not valid_items and not comment.strip() and not signers:
        return jsonify({"error": "Нечего сохранять в шаблон"}), 400

    template = RequestTemplate(
        user_id=actor.id,
        comment=comment,
        items=valid_items,
        signers=signers,
    )
    db.session.add(template)
    db.session.commit()

    return jsonify(serialize_request_template(template)), 201


@templates_bp.delete("/<int:template_id>")
def delete_template(template_id):
    actor = _get_actor()
    if not actor:
        return jsonify({"error": "Authorization required"}), 401

    template = db.session.get(RequestTemplate, template_id)
    if not template or template.user_id != actor.id:
        return jsonify({"error": "Template not found"}), 404

    db.session.delete(template)
    db.session.commit()

    return jsonify({"message": "Template deleted successfully"}), 200
