from datetime import datetime, date

from extensions import db
from models.request.request import Request
from models.request.requestItem import RequestItem
from models.request.requestStatusHistory import RequestStatusHistory
from models.user.user import User
from models.user.role import Role
from utils.stats import increment_stat


class RequestService:
    ITEMS_PER_PAGE = 15

    VALID_STATUSES = {"undeclared", "active", "archived"}
    VALID_ITEM_STATUSES = {"in_progress", "done", "rejected", "on_payment"}
    BUSINESS_ITEM_FIELDS = {"name", "unit", "quantity", "description", "deadline"}

    @staticmethod
    def _calculate_page(page: int):
        page = max(int(page), 0)
        start = page * RequestService.ITEMS_PER_PAGE
        end = start + RequestService.ITEMS_PER_PAGE
        return start, end

    @staticmethod
    def _base_query(sort="desc"):
        if sort == "asc":
            return Request.query.order_by(Request.id.asc())
        return Request.query.order_by(Request.id.desc())

    @staticmethod
    def _parse_deadline(value):
        if not value:
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            value = value.strip()
            for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
            raise ValueError(f"Неверный формат даты: '{value}'. Используйте YYYY-MM-DD или DD.MM.YYYY")
        raise ValueError("deadline has invalid format")

    @staticmethod
    def get_requests(page=0, status=None, sort="desc"):
        query = RequestService._base_query(sort=sort)
        if status:
            query = query.filter(Request.status == status)
        start, end = RequestService._calculate_page(page)
        return query.slice(start, end).all()

    @staticmethod
    def get_requests_count(status=None):
        query = Request.query
        if status:
            query = query.filter(Request.status == status)
        return query.count()

    @staticmethod
    def get_request_by_id(request_id):
        return db.session.get(Request, request_id)

    @staticmethod
    def get_undeclared_requests(page=0):
        return RequestService.get_requests(page=page, status="undeclared")

    @staticmethod
    def get_active_requests(page=0):
        return RequestService.get_requests(page=page, status="active")

    @staticmethod
    def get_archived_requests(page=0):
        return RequestService.get_requests(page=page, status="archived")

    @staticmethod
    def create_request(items, comment=None, created_by_id=None):
        if not items or not isinstance(items, list):
            raise ValueError("items must be a non-empty list")

        if created_by_id is not None:
            user = db.session.get(User, created_by_id)
            if not user:
                raise ValueError("created_by user not found")

        request_obj = Request(
            status="undeclared",
            comment=comment,
            created_by_id=created_by_id,
        )

        for item in items:
            work_status = item.get("work_status")
            is_done = item.get("is_done", item.get("isdone", False))

            if work_status not in RequestService.VALID_ITEM_STATUSES:
                work_status = "done" if is_done else "in_progress"

            deadline = RequestService._parse_deadline(item.get("deadline"))

            request_item = RequestItem(
                name=item["name"],
                unit=item["unit"],
                quantity=item["quantity"],
                description=item.get("description"),
                deadline=deadline,
                work_status=work_status,
                is_done=bool(is_done or work_status == "done")
            )
            request_obj.items.append(request_item)

        db.session.add(request_obj)
        db.session.flush()

        history_record = RequestStatusHistory(
            request_id=request_obj.id,
            from_status=None,
            to_status="undeclared",
            changed_by_id=created_by_id,
            comment="Request created",
        )
        db.session.add(history_record)
        db.session.commit()

        increment_stat(created_by_id, "requests_created")
        db.session.commit()

        return request_obj

    @staticmethod
    def update_request(request_id, **kwargs):
        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return None

        if "comment" in kwargs and request_obj.status != "undeclared":
            raise ValueError("Редактировать заявку можно только пока она без подписи")

        allowed_fields = {"comment", "assigned_to_id"}
        for key, value in kwargs.items():
            if key in allowed_fields:
                if key == "assigned_to_id" and value is not None:
                    user = db.session.get(User, value)
                    if not user:
                        raise ValueError("assigned user not found")
                setattr(request_obj, key, value)

        if "comment" in kwargs:
            request_obj.is_edited = True

        db.session.commit()
        return request_obj

    @staticmethod
    def change_status(request_id, new_status, changed_by_id=None, comment=None):
        if new_status not in RequestService.VALID_STATUSES:
            raise ValueError(f"Invalid status: {new_status}")

        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return None

        old_status = request_obj.status
        if old_status == new_status:
            return request_obj

        request_obj.status = new_status

        if new_status == "active":
            request_obj.approved_by_id = changed_by_id
            request_obj.approved_at = datetime.utcnow()

        if new_status == "archived":
            request_obj.archived_by_id = changed_by_id
            request_obj.archived_at = datetime.utcnow()
            request_obj.closed_at = datetime.utcnow()
            request_obj.assigned_to_at_archive_id = request_obj.assigned_to_id

        if old_status == "archived" and new_status != "archived":
            request_obj.archived_by_id = None
            request_obj.archived_at = None
            request_obj.assigned_to_at_archive_id = None

        history_record = RequestStatusHistory(
            request_id=request_obj.id,
            from_status=old_status,
            to_status=new_status,
            changed_by_id=changed_by_id,
            comment=comment,
        )
        db.session.add(history_record)
        db.session.commit()

        if new_status == "active":
            increment_stat(request_obj.created_by_id, "requests_approved")
            increment_stat(changed_by_id, "requests_signed_by_me")
            db.session.commit()
        elif new_status == "archived":
            increment_stat(request_obj.created_by_id, "requests_archived")
            increment_stat(changed_by_id, "requests_archived_by_me")
            db.session.commit()

        return request_obj

    @staticmethod
    def update_request_item(item_id, **kwargs):
        item = db.session.get(RequestItem, item_id)
        if not item:
            return None
        old_assigned_to_id = item.assigned_to_id

        request_obj = item.request
        if request_obj and request_obj.status == "archived":
            raise ValueError("Archived request items cannot be changed")

        touches_business_fields = bool(RequestService.BUSINESS_ITEM_FIELDS & set(kwargs.keys()))
        if touches_business_fields and request_obj and request_obj.status != "undeclared":
            raise ValueError("Редактировать содержимое заявки можно только пока она без подписи")

        allowed_fields = {
            "name",
            "unit",
            "quantity",
            "description",
            "deadline",
            "is_done",
            "work_status",
            "assigned_to_id",
        }

        if "isdone" in kwargs and "is_done" not in kwargs:
            kwargs["is_done"] = kwargs.pop("isdone")

        if "assigned_to_id" in kwargs and kwargs["assigned_to_id"] is not None:
            user = db.session.get(User, kwargs["assigned_to_id"])
            if not user:
                raise ValueError("assigned user not found")

        if "deadline" in kwargs:
            kwargs["deadline"] = RequestService._parse_deadline(kwargs.get("deadline"))

        if "work_status" in kwargs:
            work_status = kwargs.get("work_status")
            if work_status not in RequestService.VALID_ITEM_STATUSES:
                raise ValueError(f"Invalid item status: {work_status}")
            kwargs["is_done"] = work_status == "done"

        if "is_done" in kwargs and "work_status" not in kwargs:
            kwargs["work_status"] = "done" if bool(kwargs.get("is_done")) else "in_progress"

        for key, value in kwargs.items():
            if key in allowed_fields:
                setattr(item, key, value)

        if touches_business_fields and request_obj:
            request_obj.is_edited = True

        db.session.commit()

        new_assigned_to_id = item.assigned_to_id
        if new_assigned_to_id and new_assigned_to_id != old_assigned_to_id:
            increment_stat(new_assigned_to_id, "requests_assigned_to_me")
            db.session.commit()

        return item

    @staticmethod
    def add_request_item(request_id, name, unit, quantity, description=None, deadline=None):
        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return None

        item = RequestItem(
            request_id=request_obj.id,
            name=name,
            unit=unit,
            quantity=quantity,
            description=description,
            deadline=RequestService._parse_deadline(deadline),
            is_done=False,
            work_status="in_progress",
        )
        db.session.add(item)
        db.session.commit()
        return item

    @staticmethod
    def delete_request_item(item_id):
        item = db.session.get(RequestItem, item_id)
        if not item:
            return False
        db.session.delete(item)
        db.session.commit()
        return True

    @staticmethod
    def delete_request(request_id, deleted_by_id=None, reason=None):
        from utils.serializers import serialize_request
        from models.request.deletedRequest import DeletedRequest

        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return False

        creator_id = request_obj.created_by_id

        snapshot = serialize_request(request_obj)
        deletion_log = DeletedRequest(
            original_id=request_id,
            deleted_by_id=deleted_by_id or None,
            reason=reason or None,
            snapshot=snapshot,
        )
        db.session.add(deletion_log)

        history_records = RequestStatusHistory.query.filter_by(request_id=request_id).all()
        for history_record in history_records:
            db.session.delete(history_record)

        for item_in_request in request_obj.items:
            db.session.delete(item_in_request)

        db.session.delete(request_obj)
        db.session.commit()

        increment_stat(creator_id, "requests_deleted")
        db.session.commit()

        return True

    @staticmethod
    def get_deleted_requests():
        from models.request.deletedRequest import DeletedRequest
        return DeletedRequest.query.order_by(DeletedRequest.deleted_at.desc()).all()