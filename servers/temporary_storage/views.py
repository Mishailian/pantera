from secrets import token_hex

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash

from .models import (
    db,
    User,
    Author,
    Tag_post,
    Executor,
    Archive,
    Temporary_storage,
    Undeclared_temporary_storage,
)
from .serializers import (
    parse_date,
    serialize_tag,
    serialize_executor,
    serialize_archive,
    serialize_many,
    serialize_temporary_storage,
    serialize_undeclared_storage,
)

api_bp = Blueprint("api_bp", __name__)

limitOfReturnedObjects = 14


def cunculatePage(page):
    page = int(page)
    start = page * limitOfReturnedObjects
    end = start + limitOfReturnedObjects
    return start, end


def get_json_data():
    return request.get_json(silent=True) or {}


def get_author_by_value(value):
    if value in (None, ""):
        return None
    if isinstance(value, int):
        return db.session.get(Author, value)
    return Author.query.filter_by(name=str(value)).first()


def get_executor_by_value(value):
    if value in (None, ""):
        return None
    if isinstance(value, int):
        return db.session.get(Executor, value)
    try:
        return db.session.get(Executor, int(value))
    except Exception:
        return None


def get_tags_from_payload(payload):
    tags_ids = payload.get("tags", [])
    if not tags_ids:
        return []

    clean_ids = []
    for item in tags_ids:
        if isinstance(item, int):
            clean_ids.append(item)
        else:
            try:
                clean_ids.append(int(item))
            except Exception:
                pass

    if not clean_ids:
        return []

    return Tag_post.query.filter(Tag_post.id.in_(clean_ids)).all()


def apply_storage_payload(obj, payload):
    if "name" in payload:
        obj.name = payload.get("name")

    if "price_id" in payload:
        obj.price_id = payload.get("price_id")

    if "data_dead_line" in payload:
        obj.data_dead_line = parse_date(payload.get("data_dead_line"))

    if "about" in payload:
        obj.about = payload.get("about")

    if "author" in payload:
        obj.author = get_author_by_value(payload.get("author"))

    if "executor" in payload:
        obj.executor = get_executor_by_value(payload.get("executor"))

    if "tags" in payload:
        obj.tags = get_tags_from_payload(payload)

    return obj


@api_bp.route("/store/", methods=["GET", "POST"])
def store_list():
    if request.method == "POST":
        payload = get_json_data()
        obj = Temporary_storage()
        apply_storage_payload(obj, payload)
        db.session.add(obj)
        db.session.commit()
        return jsonify(serialize_temporary_storage(obj)), 201

    executor_id_param = request.args.get("ex_i")
    executor_dbase = request.args.get("get_exdb")
    page = request.args.get("page")
    countOfObjects = request.args.get("count")
    countOfFilteredObjects = request.args.get("ex_count")

    if executor_dbase:
        queryset = Executor.query.order_by(Executor.name.asc()).all()
        return jsonify(serialize_many(queryset, serialize_executor))

    if countOfObjects:
        return jsonify(Temporary_storage.query.count())

    if countOfFilteredObjects:
        try:
            executor_id = int(countOfFilteredObjects)
            count = Temporary_storage.query.filter_by(executor_id=executor_id).count()
            return jsonify(count)
        except Exception:
            return jsonify({"error": "something go wrong :("}), 400

    query = Temporary_storage.query.order_by(Temporary_storage.date_create.desc())

    if executor_id_param:
        try:
            executor_id = int(executor_id_param)
            query = query.filter_by(executor_id=executor_id)
        except ValueError:
            return jsonify({"error": "Invalid executor_id_param. Must be a valid integer."}), 400

    if page is not None:
        try:
            start, end = cunculatePage(int(page))
            queryset = query.offset(start).limit(end - start).all()
        except Exception:
            return jsonify({"error": "something go wrong :("}), 400
    else:
        queryset = query.limit(limitOfReturnedObjects).all()

    return jsonify(serialize_many(queryset, serialize_temporary_storage))


@api_bp.route("/store/<int:pk>/", methods=["GET", "PATCH", "PUT", "DELETE"])
def store_detail(pk):
    obj = db.session.get(Temporary_storage, pk)
    if not obj:
        return jsonify({"error": "object not found"}), 404

    if request.method == "GET":
        return jsonify(serialize_temporary_storage(obj))

    if request.method in ["PATCH", "PUT"]:
        payload = get_json_data()
        apply_storage_payload(obj, payload)
        db.session.commit()
        return jsonify(serialize_temporary_storage(obj))

    db.session.delete(obj)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@api_bp.route("/undeclared/", methods=["GET", "POST"])
def undeclared_list():
    if request.method == "POST":
        payload = get_json_data()
        obj = Undeclared_temporary_storage()
        apply_storage_payload(obj, payload)
        db.session.add(obj)
        db.session.commit()
        return jsonify(serialize_undeclared_storage(obj)), 201

    declared_id_param = request.args.get("declared")
    page = request.args.get("page")
    countOfObjects = request.args.get("count")

    if declared_id_param:
        try:
            declared_id_param = int(declared_id_param)
            new_obj = Undeclared_temporary_storage.declared(declared_id_param)
            return jsonify({
                "status": "declared",
                "data": serialize_temporary_storage(new_obj)
            })
        except Exception:
            return jsonify({"error": "object not found"}), 404

    if countOfObjects:
        try:
            return jsonify(Undeclared_temporary_storage.query.count())
        except Exception:
            return jsonify({"error": "something go wrong :("}), 400

    query = Undeclared_temporary_storage.query.order_by(
        Undeclared_temporary_storage.date_create.desc()
    )

    if page is not None:
        try:
            start, end = cunculatePage(int(page))
            queryset = query.offset(start).limit(end - start).all()
        except Exception:
            return jsonify({"error": "something go wrong :("}), 400
    else:
        queryset = query.limit(limitOfReturnedObjects).all()

    return jsonify(serialize_many(queryset, serialize_undeclared_storage))


@api_bp.route("/undeclared/<int:pk>/", methods=["GET", "PATCH", "PUT", "DELETE"])
def undeclared_detail(pk):
    obj = db.session.get(Undeclared_temporary_storage, pk)
    if not obj:
        return jsonify({"error": "object not found"}), 404

    if request.method == "GET":
        return jsonify(serialize_undeclared_storage(obj))

    if request.method in ["PATCH", "PUT"]:
        payload = get_json_data()
        apply_storage_payload(obj, payload)
        db.session.commit()
        return jsonify(serialize_undeclared_storage(obj))

    db.session.delete(obj)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@api_bp.route("/archive/", methods=["GET", "POST"])
def archive_list():
    if request.method == "POST":
        payload = get_json_data()
        obj = Archive()
        apply_storage_payload(obj, payload)
        db.session.add(obj)
        db.session.commit()
        return jsonify(serialize_archive(obj)), 201

    queryset = Archive.query.order_by(Archive.date_create.desc()).all()
    return jsonify(serialize_many(queryset, serialize_archive))


@api_bp.route("/archive/<int:pk>/", methods=["GET", "DELETE"])
def archive_detail(pk):
    obj = db.session.get(Archive, pk)
    if not obj:
        return jsonify({"error": "object not found"}), 404

    if request.method == "GET":
        return jsonify(serialize_archive(obj))

    db.session.delete(obj)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@api_bp.route("/tags/", methods=["GET", "POST"])
def tags_list():
    if request.method == "POST":
        payload = get_json_data()
        name = payload.get("name")

        if not name:
            return jsonify({"error": "name is required"}), 400

        tag = Tag_post(name=name)
        db.session.add(tag)
        db.session.commit()
        return jsonify(serialize_tag(tag)), 201

    queryset = Tag_post.query.order_by(Tag_post.name.asc()).all()
    return jsonify(serialize_many(queryset, serialize_tag))


@api_bp.route("/tags/<int:pk>/", methods=["GET", "PUT", "PATCH", "DELETE"])
def tags_detail(pk):
    tag = db.session.get(Tag_post, pk)
    if not tag:
        return jsonify({"error": "object not found"}), 404

    if request.method == "GET":
        return jsonify(serialize_tag(tag))

    if request.method in ["PUT", "PATCH"]:
        payload = get_json_data()
        if "name" in payload:
            tag.name = payload.get("name")
        db.session.commit()
        return jsonify(serialize_tag(tag))

    db.session.delete(tag)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@api_bp.route("/users/", methods=["GET", "POST"])
def users_list():
    if request.method == "POST":
        payload = get_json_data()
        name = payload.get("name")

        if not name:
            return jsonify({"error": "name is required"}), 400

        user = Executor(name=name)
        db.session.add(user)
        db.session.commit()
        return jsonify(serialize_executor(user)), 201

    queryset = Executor.query.order_by(Executor.name.asc()).all()
    return jsonify(serialize_many(queryset, serialize_executor))


@api_bp.route("/users/<int:pk>/", methods=["GET", "PUT", "PATCH", "DELETE"])
def users_detail(pk):
    user = db.session.get(Executor, pk)
    if not user:
        return jsonify({"error": "object not found"}), 404

    if request.method == "GET":
        return jsonify(serialize_executor(user))

    if request.method in ["PUT", "PATCH"]:
        payload = get_json_data()
        if "name" in payload:
            user.name = payload.get("name")
        db.session.commit()
        return jsonify(serialize_executor(user))

    db.session.delete(user)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@api_bp.route("/token/", methods=["POST", "GET"])
def obtain_token():
    if request.method == "GET":
        return jsonify({"error": "use post request"}), 405

    payload = get_json_data()
    username = payload.get("username")
    password = payload.get("password")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    if not user.token:
        user.token = token_hex(32)
        db.session.commit()

    author = user.author

    return jsonify({
        "token": user.token,
        "id": user.id,
        "username_id": user.id,
        "username": author.name if author else user.username,
        "is_superuser": user.is_superuser,
    })
