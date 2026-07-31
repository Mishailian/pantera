from datetime import date, datetime

from extensions import db

from models.request.request import Request
from models.request.requestItem import RequestItem
from models.request.requestStatusHistory import RequestStatusHistory
from models.user.user import User

from utils.stats import increment_stat


class RequestService:
    ITEMS_PER_PAGE = 15

    VALID_STATUSES = {
        "undeclared",
        "active",
        "archived",
    }

    VALID_ITEM_STATUSES = {
        "in_progress",
        "done",
        "rejected",
        "on_payment",
        "on_the_way"
    }

    VALID_DEPARTMENTS = {
        "supply",
        "rezo",
    }

    BUSINESS_ITEM_FIELDS = {
        "name",
        "unit",
        "quantity",
        "description",
        "deadline",
    }

    ITEM_MANAGEMENT_FIELDS = {
        "is_done",
        "work_status",
        "assigned_to_id",
    }

    SUPPLY_EDIT_ROLES = {
        "admin",
        "supply_manager",
        "supply_head",
    }

    STATUS_MANAGEMENT_ROLES = {
        "admin",
        "supply_manager",
        "supply_head",
    }

    DELETE_ROLES = {
        "admin",
    }

    @staticmethod
    def _get_role_name(user):
        if not user:
            return None

        role = getattr(
            user,
            "role",
            None,
        )

        if not role:
            return None

        return getattr(
            role,
            "name",
            None,
        )

    @staticmethod
    def _can_manage_request(actor):
        role_name = RequestService._get_role_name(
            actor
        )

        return (
            role_name
            in RequestService.SUPPLY_EDIT_ROLES
        )

    @staticmethod
    def _can_change_request_status(actor):
        role_name = RequestService._get_role_name(
            actor
        )

        return (
            role_name
            in RequestService.STATUS_MANAGEMENT_ROLES
        )

    @staticmethod
    def _can_delete_request(actor):
        role_name = RequestService._get_role_name(
            actor
        )

        return (
            role_name
            in RequestService.DELETE_ROLES
        )

    @staticmethod
    def _can_edit_request(actor, request_obj):
        if not actor or not request_obj:
            return False

        if RequestService._can_manage_request(actor):
            return True

        return (
            request_obj.created_by_id == actor.id
            and request_obj.status == "undeclared"
        )

    @staticmethod
    def can_user_read_request(actor, request_obj):
        if not actor or not request_obj:
            return False

        role_name = RequestService._get_role_name(
            actor
        )

        if role_name in {
            "admin",
            "it_department",
            "it_head",
        }:
            return True

        if request_obj.created_by_id == actor.id:
            return True

        if role_name in {
            "supply_manager",
            "supply_head",
        }:
            return request_obj.department == "supply"

        if role_name in {
            "rezo_department",
            "rezo_head",
        }:
            return request_obj.department == "rezo"

        return False

    @staticmethod
    def _calculate_page(page):
        page = max(
            int(page),
            0,
        )

        start = (
            page
            * RequestService.ITEMS_PER_PAGE
        )

        end = (
            start
            + RequestService.ITEMS_PER_PAGE
        )

        return start, end

    @staticmethod
    def _base_query(sort="desc"):
        if sort == "asc":
            return Request.query.order_by(
                Request.id.asc()
            )

        return Request.query.order_by(
            Request.id.desc()
        )

    @staticmethod
    def _parse_deadline(value):
        if not value:
            return None

        if isinstance(value, date):
            return value

        if isinstance(value, str):
            value = value.strip()

            for date_format in (
                "%Y-%m-%d",
                "%d.%m.%Y",
                "%d/%m/%Y",
                "%m/%d/%Y",
            ):
                try:
                    return datetime.strptime(
                        value,
                        date_format,
                    ).date()

                except ValueError:
                    continue

            raise ValueError(
                f"Неверный формат даты: '{value}'. "
                "Используйте YYYY-MM-DD или DD.MM.YYYY"
            )

        raise ValueError(
            "deadline has invalid format"
        )

    @staticmethod
    def get_requests(
        page=0,
        status=None,
        sort="desc",
        department=None,
    ):
        query = RequestService._base_query(
            sort=sort
        )

        if status:
            query = query.filter(
                Request.status == status
            )

        if department:
            query = query.filter(
                Request.department == department
            )

        start, end = (
            RequestService._calculate_page(page)
        )

        return query.slice(
            start,
            end,
        ).all()

    @staticmethod
    def get_requests_count(
        status=None,
        department=None,
    ):
        query = Request.query

        if status:
            query = query.filter(
                Request.status == status
            )

        if department:
            query = query.filter(
                Request.department == department
            )

        return query.count()

    @staticmethod
    def get_request_by_id(request_id):
        return db.session.get(
            Request,
            request_id,
        )

    @staticmethod
    def get_request_item_by_id(item_id):
        return db.session.get(
            RequestItem,
            item_id,
        )

    @staticmethod
    def get_undeclared_requests(page=0):
        return RequestService.get_requests(
            page=page,
            status="undeclared",
        )

    @staticmethod
    def get_active_requests(page=0):
        return RequestService.get_requests(
            page=page,
            status="active",
        )

    @staticmethod
    def get_archived_requests(page=0):
        return RequestService.get_requests(
            page=page,
            status="archived",
        )

    @staticmethod
    def create_request(
        items,
        comment=None,
        created_by_id=None,
        department="supply",
    ):
        if not items or not isinstance(
            items,
            list,
        ):
            raise ValueError(
                "items must be a non-empty list"
            )

        if (
            department
            not in RequestService.VALID_DEPARTMENTS
        ):
            department = "supply"

        if created_by_id is not None:
            user = db.session.get(
                User,
                created_by_id,
            )

            if not user:
                raise ValueError(
                    "created_by user not found"
                )

        request_obj = Request(
            status="undeclared",
            department=department,
            comment=comment,
            created_by_id=created_by_id,
        )

        for item_data in items:
            name = str(
                item_data.get(
                    "name",
                    "",
                )
            ).strip()

            unit = str(
                item_data.get(
                    "unit",
                    "",
                )
            ).strip()

            quantity = item_data.get(
                "quantity"
            )

            if not name:
                raise ValueError(
                    "item name is required"
                )

            if not unit:
                raise ValueError(
                    "item unit is required"
                )

            try:
                quantity = float(quantity)
            except (
                TypeError,
                ValueError,
            ):
                raise ValueError(
                    "item quantity must be a number"
                )

            if quantity <= 0:
                raise ValueError(
                    "item quantity must be greater than zero"
                )

            work_status = item_data.get(
                "work_status"
            )

            is_done = item_data.get(
                "is_done",
                item_data.get(
                    "isdone",
                    False,
                ),
            )

            if (
                work_status
                not in RequestService.VALID_ITEM_STATUSES
            ):
                work_status = (
                    "done"
                    if is_done
                    else "in_progress"
                )

            deadline = (
                RequestService._parse_deadline(
                    item_data.get(
                        "deadline"
                    )
                )
            )

            request_item = RequestItem(
                name=name,
                unit=unit,
                quantity=quantity,
                description=item_data.get(
                    "description"
                ),
                deadline=deadline,
                work_status=work_status,
                is_done=bool(
                    is_done
                    or work_status == "done"
                ),
            )

            request_obj.items.append(
                request_item
            )

        db.session.add(
            request_obj
        )

        db.session.flush()

        history_record = RequestStatusHistory(
            request_id=request_obj.id,
            from_status=None,
            to_status="undeclared",
            changed_by_id=created_by_id,
            comment="Request created",
        )

        db.session.add(
            history_record
        )

        db.session.commit()

        if created_by_id is not None:
            increment_stat(
                created_by_id,
                "requests_created",
            )

            db.session.commit()

        return request_obj

    @staticmethod
    def update_request(
        request_id,
        actor=None,
        **kwargs,
    ):
        request_obj = (
            RequestService.get_request_by_id(
                request_id
            )
        )

        if not request_obj:
            return None

        if not RequestService._can_edit_request(
            actor,
            request_obj,
        ):
            raise PermissionError(
                "Недостаточно прав для редактирования заявки"
            )

        allowed_fields = {
            "comment",
            "assigned_to_id",
        }

        if (
            "assigned_to_id" in kwargs
            and not RequestService._can_manage_request(
                actor
            )
        ):
            raise PermissionError(
                "Недостаточно прав для назначения исполнителя"
            )

        for key, value in kwargs.items():
            if key not in allowed_fields:
                continue

            if (
                key == "assigned_to_id"
                and value is not None
            ):
                assigned_user = db.session.get(
                    User,
                    value,
                )

                if not assigned_user:
                    raise ValueError(
                        "assigned user not found"
                    )

            setattr(
                request_obj,
                key,
                value,
            )

        if "comment" in kwargs:
            request_obj.is_edited = True

        db.session.commit()

        return request_obj

    @staticmethod
    def change_status(
        request_id,
        new_status,
        changed_by_id=None,
        comment=None,
        actor=None,
    ):
        if (
            new_status
            not in RequestService.VALID_STATUSES
        ):
            raise ValueError(
                f"Invalid status: {new_status}"
            )

        request_obj = (
            RequestService.get_request_by_id(
                request_id
            )
        )

        if not request_obj:
            return None

        if not RequestService._can_change_request_status(
            actor
        ):
            raise PermissionError(
                "Недостаточно прав для изменения статуса заявки"
            )

        old_status = request_obj.status

        if old_status == new_status:
            return request_obj

        request_obj.status = new_status

        if new_status == "active":
            request_obj.approved_by_id = (
                changed_by_id
            )

            request_obj.approved_at = (
                datetime.utcnow()
            )

        if new_status == "archived":
            request_obj.archived_by_id = (
                changed_by_id
            )

            request_obj.archived_at = (
                datetime.utcnow()
            )

            request_obj.closed_at = (
                datetime.utcnow()
            )

            request_obj.assigned_to_at_archive_id = (
                request_obj.assigned_to_id
            )

        if (
            old_status == "archived"
            and new_status != "archived"
        ):
            request_obj.archived_by_id = None
            request_obj.archived_at = None
            request_obj.closed_at = None
            request_obj.assigned_to_at_archive_id = None

        history_record = RequestStatusHistory(
            request_id=request_obj.id,
            from_status=old_status,
            to_status=new_status,
            changed_by_id=changed_by_id,
            comment=comment,
        )

        db.session.add(
            history_record
        )

        db.session.commit()

        if new_status == "active":
            if request_obj.created_by_id:
                increment_stat(
                    request_obj.created_by_id,
                    "requests_approved",
                )

            if changed_by_id:
                increment_stat(
                    changed_by_id,
                    "requests_signed_by_me",
                )

            db.session.commit()

        elif new_status == "archived":
            if request_obj.created_by_id:
                increment_stat(
                    request_obj.created_by_id,
                    "requests_archived",
                )

            if changed_by_id:
                increment_stat(
                    changed_by_id,
                    "requests_archived_by_me",
                )

            db.session.commit()

        return request_obj

    @staticmethod
    def update_request_item(
        item_id,
        actor=None,
        **kwargs,
    ):
        item = (
            RequestService.get_request_item_by_id(
                item_id
            )
        )

        if not item:
            return None

        request_obj = item.request

        if not request_obj:
            raise ValueError(
                "Заявка для позиции не найдена"
            )

        if not RequestService._can_edit_request(
            actor,
            request_obj,
        ):
            raise PermissionError(
                "Недостаточно прав для редактирования позиции"
            )

        old_assigned_to_id = (
            item.assigned_to_id
        )

        if (
            "isdone" in kwargs
            and "is_done" not in kwargs
        ):
            kwargs["is_done"] = kwargs.pop(
                "isdone"
            )

        touches_management_fields = bool(
            RequestService.ITEM_MANAGEMENT_FIELDS
            & set(kwargs.keys())
        )

        if (
            touches_management_fields
            and not RequestService._can_manage_request(
                actor
            )
        ):
            raise PermissionError(
                "Недостаточно прав для изменения статуса или исполнителя"
            )

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

        if (
            "assigned_to_id" in kwargs
            and kwargs["assigned_to_id"] is not None
        ):
            assigned_user = db.session.get(
                User,
                kwargs["assigned_to_id"],
            )

            if not assigned_user:
                raise ValueError(
                    "assigned user not found"
                )

        if "name" in kwargs:
            kwargs["name"] = str(
                kwargs["name"] or ""
            ).strip()

            if not kwargs["name"]:
                raise ValueError(
                    "item name is required"
                )

        if "unit" in kwargs:
            kwargs["unit"] = str(
                kwargs["unit"] or ""
            ).strip()

            if not kwargs["unit"]:
                raise ValueError(
                    "item unit is required"
                )

        if "quantity" in kwargs:
            try:
                quantity = float(
                    kwargs["quantity"]
                )
            except (
                TypeError,
                ValueError,
            ):
                raise ValueError(
                    "item quantity must be a number"
                )

            if quantity <= 0:
                raise ValueError(
                    "item quantity must be greater than zero"
                )

            kwargs["quantity"] = quantity

        if "deadline" in kwargs:
            kwargs["deadline"] = (
                RequestService._parse_deadline(
                    kwargs.get(
                        "deadline"
                    )
                )
            )

        if "work_status" in kwargs:
            work_status = kwargs.get(
                "work_status"
            )

            if (
                work_status
                not in RequestService.VALID_ITEM_STATUSES
            ):
                raise ValueError(
                    f"Invalid item status: {work_status}"
                )

            kwargs["is_done"] = (
                work_status == "done"
            )

        if (
            "is_done" in kwargs
            and "work_status" not in kwargs
        ):
            kwargs["work_status"] = (
                "done"
                if bool(
                    kwargs.get(
                        "is_done"
                    )
                )
                else "in_progress"
            )

        for key, value in kwargs.items():
            if key in allowed_fields:
                setattr(
                    item,
                    key,
                    value,
                )

        touches_business_fields = bool(
            RequestService.BUSINESS_ITEM_FIELDS
            & set(kwargs.keys())
        )

        if touches_business_fields:
            request_obj.is_edited = True

        db.session.commit()

        new_assigned_to_id = (
            item.assigned_to_id
        )

        if (
            new_assigned_to_id
            and new_assigned_to_id
            != old_assigned_to_id
        ):
            increment_stat(
                new_assigned_to_id,
                "requests_assigned_to_me",
            )

            db.session.commit()

        return item

    @staticmethod
    def add_request_item(
        request_id,
        actor,
        name,
        unit,
        quantity,
        description=None,
        deadline=None,
    ):
        request_obj = (
            RequestService.get_request_by_id(
                request_id
            )
        )

        if not request_obj:
            return None

        if not RequestService._can_edit_request(
            actor,
            request_obj,
        ):
            raise PermissionError(
                "Недостаточно прав для добавления позиции"
            )

        name = str(
            name or ""
        ).strip()

        unit = str(
            unit or ""
        ).strip()

        if not name:
            raise ValueError(
                "item name is required"
            )

        if not unit:
            raise ValueError(
                "item unit is required"
            )

        try:
            quantity = float(
                quantity
            )
        except (
            TypeError,
            ValueError,
        ):
            raise ValueError(
                "item quantity must be a number"
            )

        if quantity <= 0:
            raise ValueError(
                "item quantity must be greater than zero"
            )

        item = RequestItem(
            request_id=request_obj.id,
            name=name,
            unit=unit,
            quantity=quantity,
            description=description,
            deadline=(
                RequestService._parse_deadline(
                    deadline
                )
            ),
            is_done=False,
            work_status="in_progress",
        )

        request_obj.is_edited = True

        db.session.add(
            item
        )

        db.session.commit()

        return item

    @staticmethod
    def delete_request_item(
        item_id,
        actor=None,
    ):
        item = (
            RequestService.get_request_item_by_id(
                item_id
            )
        )

        if not item:
            return False

        request_obj = item.request

        if not RequestService._can_edit_request(
            actor,
            request_obj,
        ):
            raise PermissionError(
                "Недостаточно прав для удаления позиции"
            )

        db.session.delete(
            item
        )

        if request_obj:
            request_obj.is_edited = True

        db.session.commit()

        return True

    @staticmethod
    def delete_request(
        request_id,
        deleted_by_id=None,
        reason=None,
        actor=None,
    ):
        from models.request.deletedRequest import DeletedRequest
        from utils.serializers import serialize_request

        request_obj = (
            RequestService.get_request_by_id(
                request_id
            )
        )

        if not request_obj:
            return False

        if not RequestService._can_delete_request(
            actor
        ):
            raise PermissionError(
                "Недостаточно прав для удаления заявки"
            )

        creator_id = (
            request_obj.created_by_id
        )

        snapshot = serialize_request(
            request_obj
        )

        deletion_log = DeletedRequest(
            original_id=request_id,
            deleted_by_id=deleted_by_id,
            reason=reason,
            snapshot=snapshot,
        )

        db.session.add(
            deletion_log
        )

        history_records = (
            RequestStatusHistory.query
            .filter_by(
                request_id=request_id
            )
            .all()
        )

        for history_record in history_records:
            db.session.delete(
                history_record
            )

        for request_item in list(
            request_obj.items
        ):
            db.session.delete(
                request_item
            )

        db.session.delete(
            request_obj
        )

        db.session.commit()

        if creator_id:
            increment_stat(
                creator_id,
                "requests_deleted",
            )

            db.session.commit()

        return True

    @staticmethod
    def get_deleted_requests():
        from models.request.deletedRequest import DeletedRequest

        return (
            DeletedRequest.query
            .order_by(
                DeletedRequest.deleted_at.desc()
            )
            .all()
        )
