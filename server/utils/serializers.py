from datetime import date
from flask import jsonify
from app.models.temporary_storage import Temporary_storage
from app.models.undeclared_temporary_storage import Undeclared_temporary_storage
from app.models.archive import Archive
from app.models.tag_post import Tag_post
from app.models.executor import Executor


def serialize_tag(tag):
    return {"id": tag.id, "name": tag.name}


def serialize_executor(executor):
    return {"id": executor.id, "name": executor.name}


def serialize_temporary_storage(storage):
    return {
        "id": storage.id,
        "name": storage.name,
        "price_id": getattr(storage, 'price_id', None),
        "date_created": storage.date_created.isoformat() if storage.date_created else None,
        "tags": [serialize_tag(tag) for tag in storage.tags]
    }


def serialize_undeclared_storage(storage):
    return {
        "id": storage.id,
        "name": storage.name,
        "price_id": getattr(storage, 'price_id', None),
        "date_created": storage.date_created.isoformat() if storage.date_created else None,
        "tags": [serialize_tag(tag) for tag in storage.tags]
    }


def serialize_archive(archive):
    return {
        "id": archive.id,
        "name": archive.name,
        "price_id": getattr(archive, 'price_id', None),
        "date_created": archive.date_created.isoformat() if archive.date_created else None,
        "tags": [serialize_tag(tag) for tag in archive.tags]
    }


def serialize_many(objects, serializer):
    return [serializer(obj) for obj in objects]


def parse_date(date_str):
    """Парсит дату из строки"""
    try:
        return date.fromisoformat(date_str) if date_str else None
    except:
        return None
