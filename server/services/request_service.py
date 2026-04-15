from datetime import datetime

from extensions import db
from models.request.request import Request
from models.request.requestItem import RequestItem
from models.request.requestStatusHistory import RequestStatusHistory
from models.user.user import User
from models.user.role import Role


class RequestService:
    ITEMS_PER_PAGE = 14

    VALID_STATUSES = {"undeclared", "active", "archived"}

    @staticmethod
    def _calculate_page(page: int):
        page = max(int(page), 0)
        start = page * RequestService.ITEMS_PER_PAGE
        end = start + RequestService.ITEMS_PER_PAGE
        return start, end

    @staticmethod
    def _base_query():
        return Request.query.order_by(Request.created_at.desc())

    @staticmethod
    def get_requests(page=0, status=None):
        query = RequestService._base_query()

        if status:
            query = query.filter(Request.status == status)

        start, end = RequestService._calculate_page(page)
        return query.slice(start, end).all()

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
            request_item = RequestItem(
                name=item["name"],
                unit=item["unit"],
                quantity=item["quantity"],
                description=item.get("description"),
                is_done=item.get("is_done", False),
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

        return request_obj

    @staticmethod
    def update_request(request_id, **kwargs):
        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return None

        allowed_fields = {
            "comment",
            "assigned_to_id",
        }

        for key, value in kwargs.items():
            if key in allowed_fields:
                if key == "assigned_to_id" and value is not None:
                    user = db.session.get(User, value)
                    if not user:
                        raise ValueError("assigned user not found")
                setattr(request_obj, key, value)

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

        return request_obj

    @staticmethod
    def update_request_item(item_id, **kwargs):
        item = db.session.get(RequestItem, item_id)
        if not item:
            return None

        allowed_fields = {
            "name",
            "unit",
            "quantity",
            "description",
            "is_done",
        }

        for key, value in kwargs.items():
            if key in allowed_fields:
                setattr(item, key, value)

        db.session.commit()
        return item

    @staticmethod
    def add_request_item(request_id, name, unit, quantity, description=None):
        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return None

        item = RequestItem(
            request_id=request_obj.id,
            name=name,
            unit=unit,
            quantity=quantity,
            description=description,
            is_done=False,
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
    def delete_request(request_id):
        request_obj = RequestService.get_request_by_id(request_id)
        if not request_obj:
            return False

        history_records = RequestStatusHistory.query.filter_by(request_id=request_id).all()
        for history_record in history_records:
            db.session.delete(history_record)

        db.session.delete(request_obj)
        db.session.commit()
        return True