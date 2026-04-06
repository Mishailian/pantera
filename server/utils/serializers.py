from datetime import date


def serialize_many(objects, serializer):
    return [serializer(obj) for obj in objects]


def parse_date(date_str):
    try:
        return date.fromisoformat(date_str) if date_str else None
    except Exception:
        return None


def serialize_role(role):
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
    }


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "roles": [serialize_role(role) for role in user.roles],
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


def serialize_tag(tag):
    return {
        "id": tag.id,
        "name": tag.name,
    }


def serialize_request_item(item):
    return {
        "id": item.id,
        "request_id": item.request_id,
        "name": item.name,
        "unit": item.unit,
        "quantity": float(item.quantity),
        "description": item.description,
        "is_done": item.is_done,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_request(request_obj):
    return {
        "id": request_obj.id,
        "status": request_obj.status,
        "comment": request_obj.comment,
        "created_by_id": request_obj.created_by_id,
        "approved_by_id": request_obj.approved_by_id,
        "assigned_to_id": request_obj.assigned_to_id,
        "created_at": request_obj.created_at.isoformat() if request_obj.created_at else None,
        "updated_at": request_obj.updated_at.isoformat() if request_obj.updated_at else None,
        "approved_at": request_obj.approved_at.isoformat() if request_obj.approved_at else None,
        "closed_at": request_obj.closed_at.isoformat() if request_obj.closed_at else None,
        "items": [serialize_request_item(item) for item in request_obj.items],
    }
