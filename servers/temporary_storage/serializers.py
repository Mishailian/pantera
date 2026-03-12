from datetime import datetime, date

from .models import (
    Tag_post,
    Executor,
    Author,
    User,
    Temporary_storage,
    Undeclared_temporary_storage,
    Archive,
)


def _date_to_str(value):
    if not value:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def parse_date(value):
    if value in (None, ""):
        return None
    if isinstance(value, date):
        return value
    return datetime.fromisoformat(value).date()


def serialize_tag(tag: Tag_post):
    return {
        "id": tag.id,
        "name": tag.name,
    }


def serialize_executor(executor: Executor):
    return {
        "id": executor.id,
        "name": executor.name,
    }


def serialize_author(author: Author):
    return {
        "id": author.id,
        "name": author.name,
        "user_id": author.user_id,
    }


def serialize_user(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "is_superuser": user.is_superuser,
    }


def serialize_storage(obj):
    return {
        "id": obj.id,
        "name": obj.name,
        "price_id": obj.price_id,
        "date_create": _date_to_str(obj.date_create),
        "data_dead_line": _date_to_str(obj.data_dead_line),
        "data_update": _date_to_str(obj.data_update),
        "about": obj.about,
        "author": obj.author.name if obj.author else None,
        "executor": obj.executor.id if obj.executor else None,
        "tags": [tag.id for tag in obj.tags],
    }


def serialize_temporary_storage(obj: Temporary_storage):
    return serialize_storage(obj)


def serialize_undeclared_storage(obj: Undeclared_temporary_storage):
    return serialize_storage(obj)


def serialize_archive(obj: Archive):
    return serialize_storage(obj)


def serialize_many(items, serializer):
    return [serializer(item) for item in items]
