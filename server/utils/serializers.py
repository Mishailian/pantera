from datetime import date
from zoneinfo import ZoneInfo


def serialize_many(objects, serializer):
    return [serializer(obj) for obj in objects]


def parse_date(date_str):
    try:
        return date.fromisoformat(date_str) if date_str else None
    except Exception:
        return None


def format_datetime_ekb(dt):
    if not dt:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))

    ekb_dt = dt.astimezone(ZoneInfo("Asia/Yekaterinburg"))
    return ekb_dt.strftime("%d.%m.%Y %H:%M")


def serialize_role(role):
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
    }


def serialize_user(user):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "number": user.number,
        "is_active": user.is_active,
        "roles": [serialize_role(role) for role in user.roles],
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


def serialize_user_min(user):
    if not user:
        return None

    first_role = user.roles[0] if user.roles else None

    return {
        "id": user.id,
        "full_name": user.full_name,
        "number": user.number,
        "role": first_role.name if first_role else None,
        "role_label": first_role.description if first_role else None,
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
        "deadline": item.deadline.isoformat() if getattr(item, "deadline", None) else None,
        "is_done": item.is_done,
        "work_status": getattr(item, "work_status", "in_progress"),
        "assigned_to_id": getattr(item, "assigned_to_id", None),
        "assigned_to_user": serialize_user_min(getattr(item, "assigned_to", None)),
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_request_template(template):
    items = template.items or []
    return {
        "id": template.id,
        "user_id": template.user_id,
        "comment": template.comment,
        "items": items,
        "items_count": len(items),
        "signers": template.signers or [],
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "created_at_formatted": format_datetime_ekb(template.created_at),
    }


def serialize_role_request(req):
    return {
        "id": req.id,
        "user_id": req.user_id,
        "user": serialize_user_min(req.user) if req.user else None,
        "requested_role": req.requested_role,
        "status": req.status,
        "request_type": getattr(req, "request_type", "role_change"),
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "created_at_formatted": format_datetime_ekb(req.created_at),
        "reviewed_by_id": req.reviewed_by_id,
        "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None,
        "reviewed_at_formatted": format_datetime_ekb(req.reviewed_at),
    }


def serialize_deleted_request(deleted_req):
    return {
        "id": deleted_req.id,
        "original_id": deleted_req.original_id,
        "deleted_by_id": deleted_req.deleted_by_id,
        "deleted_by_user": serialize_user_min(deleted_req.deleted_by) if deleted_req.deleted_by else None,
        "deleted_at": deleted_req.deleted_at.isoformat() if deleted_req.deleted_at else None,
        "deleted_at_formatted": format_datetime_ekb(deleted_req.deleted_at),
        "reason": deleted_req.reason,
        "snapshot": deleted_req.snapshot,
    }


def serialize_request(request_obj):
    items = [serialize_request_item(item) for item in request_obj.items]

    assigned_usernames = []
    seen_usernames = set()
    for item in request_obj.items:
        u = getattr(item, "assigned_to", None)
        if u and u.number not in seen_usernames:
            seen_usernames.add(u.number)
            assigned_usernames.append(u.number)

    return {
        "id": request_obj.id,
        "status": request_obj.status,
        "comment": request_obj.comment,
        "is_edited": bool(getattr(request_obj, "is_edited", False)),
        "created_by_id": request_obj.created_by_id,
        "approved_by_id": request_obj.approved_by_id,
        "archived_by_id": getattr(request_obj, "archived_by_id", None),
        "assigned_to_id": getattr(request_obj, "assigned_to_id", None),
        "created_at": request_obj.created_at.isoformat() if request_obj.created_at else None,
        "updated_at": request_obj.updated_at.isoformat() if request_obj.updated_at else None,
        "approved_at": request_obj.approved_at.isoformat() if request_obj.approved_at else None,
        "closed_at": request_obj.closed_at.isoformat() if request_obj.closed_at else None,
        "archived_at": getattr(request_obj, "archived_at", None) and getattr(request_obj, "archived_at").isoformat(),
        "created_at_formatted": format_datetime_ekb(request_obj.created_at),
        "updated_at_formatted": format_datetime_ekb(request_obj.updated_at),
        "approved_at_formatted": format_datetime_ekb(request_obj.approved_at),
        "closed_at_formatted": format_datetime_ekb(request_obj.closed_at),
        "archived_at_formatted": format_datetime_ekb(getattr(request_obj, "archived_at", None)),
        "items_count": len(items),
        "items_preview": items[:3],
        "items": items,
        "assigned_usernames": assigned_usernames,
        "created_by_user": serialize_user_min(getattr(request_obj, "created_by", None)),
        "approved_by_user": serialize_user_min(getattr(request_obj, "approved_by", None)),
        "archived_by_user": serialize_user_min(getattr(request_obj, "archived_by", None)),
        "assigned_to_user": serialize_user_min(getattr(request_obj, "assigned_to", None)),
        "assigned_to_at_archive_id": getattr(request_obj, "assigned_to_at_archive_id", None),
        "assigned_to_at_archive_user": serialize_user_min(getattr(request_obj, "assigned_to_at_archive", None)),
    }