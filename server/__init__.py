from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, migrate

from routes.health import health_bp
from routes.auth import auth_bp
from routes.users import users_bp
from routes.request import requests_bp
from routes.roles import roles_bp
from routes.templates import templates_bp
from routes.role_requests import role_requests_bp
from errors.handlers import register_error_handlers
from utils.logger import setup_logger


def _ensure_request_department_column(app):
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        if "requests" not in inspector.get_table_names():
            return
        columns = {col["name"] for col in inspector.get_columns("requests")}
        if "department" not in columns:
            db.session.execute(text(
                "ALTER TABLE requests ADD COLUMN IF NOT EXISTS department VARCHAR(20) NOT NULL DEFAULT 'supply'"
            ))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding department column to requests: {e}")


def _ensure_request_item_work_status(app):
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "request_items" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("request_items")}

        if "deadline" not in columns:
            db.session.execute(text("""
                ALTER TABLE request_items
                ADD COLUMN IF NOT EXISTS deadline DATE
            """))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating request_items table: {e}")

def _migrate_remove_username_clean_db(app):
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "users" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("users")}

        if "username" not in columns:
            return

        result = db.session.execute(
            text("SELECT id FROM users WHERE number IS NULL OR TRIM(number) = ''")
        )
        no_phone_ids = [row[0] for row in result.fetchall()]

        if no_phone_ids:
            ids = ",".join(str(i) for i in no_phone_ids)

            for col in ("created_by_id", "approved_by_id", "archived_by_id",
                        "assigned_to_id", "assigned_to_at_archive_id"):
                db.session.execute(text(
                    f"UPDATE requests SET {col} = NULL WHERE {col} IN ({ids})"
                ))

            db.session.execute(text(
                f"UPDATE request_items SET assigned_to_id = NULL WHERE assigned_to_id IN ({ids})"
            ))

            db.session.execute(text(
                f"UPDATE request_status_history SET changed_by_id = NULL WHERE changed_by_id IN ({ids})"
            ))

            db.session.execute(text(
                f"DELETE FROM user_profile_history WHERE target_user_id IN ({ids})"
            ))
            db.session.execute(text(
                f"UPDATE user_profile_history SET changed_by_user_id = NULL WHERE changed_by_user_id IN ({ids})"
            ))

            db.session.execute(text(
                f"DELETE FROM user_roles WHERE user_id IN ({ids})"
            ))

            db.session.execute(text(
                f"DELETE FROM users WHERE id IN ({ids})"
            ))

            db.session.commit()

        db.session.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS username"))
        db.session.commit()

        db.session.execute(text("ALTER TABLE users ALTER COLUMN number SET NOT NULL"))
        try:
            db.session.execute(text(
                "ALTER TABLE users ADD CONSTRAINT users_number_unique UNIQUE (number)"
            ))
        except Exception:
            db.session.rollback()
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in _migrate_remove_username_clean_db: {e}")


def _ensure_user_stats_table(app):
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if "user_stats" not in inspector.get_table_names():
            from models.stats.user_stats import UserStats
            UserStats.__table__.create(db.engine)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating user_stats table: {e}")


def _ensure_request_templates_table(app):
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if "request_templates" not in inspector.get_table_names():
            from models.request.requestTemplate import RequestTemplate
            RequestTemplate.__table__.create(db.engine)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating request_templates table: {e}")


def _ensure_deleted_requests_table(app):
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if "deleted_requests" not in inspector.get_table_names():
            from models.request.deletedRequest import DeletedRequest
            DeletedRequest.__table__.create(db.engine)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating deleted_requests table: {e}")


def _ensure_role_change_requests_table(app):
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if "role_change_requests" not in inspector.get_table_names():
            from models.user.roleChangeRequest import RoleChangeRequest
            RoleChangeRequest.__table__.create(db.engine)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating role_change_requests table: {e}")


def _ensure_role_change_request_type_column(app):
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        if "role_change_requests" not in inspector.get_table_names():
            return
        columns = {col["name"] for col in inspector.get_columns("role_change_requests")}
        if "request_type" not in columns:
            db.session.execute(text(
                "ALTER TABLE role_change_requests "
                "ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) NOT NULL DEFAULT 'role_change'"
            ))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding request_type column: {e}")


def _ensure_user_profile_history_target_nullable(app):
    """Делает target_user_id nullable и добавляет ON DELETE SET NULL для логов удалений."""
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        if "user_profile_history" not in inspector.get_table_names():
            return

        cols = {c["name"]: c for c in inspector.get_columns("user_profile_history")}
        target_col = cols.get("target_user_id")
        if not target_col:
            return

        if not target_col["nullable"]:
            db.session.execute(text(
                "ALTER TABLE user_profile_history ALTER COLUMN target_user_id DROP NOT NULL"
            ))

        fks = inspector.get_foreign_keys("user_profile_history")
        target_fk = next(
            (fk for fk in fks if "target_user_id" in fk.get("constrained_columns", [])),
            None
        )
        # Пересоздаём FK с ON DELETE SET NULL если текущий не такой
        needs_recreate = True
        if target_fk:
            # SQLAlchemy не всегда возвращает options, просто пересоздаём
            fk_name = target_fk.get("name") or "user_profile_history_target_user_id_fkey"
            try:
                db.session.execute(text(
                    f"ALTER TABLE user_profile_history DROP CONSTRAINT IF EXISTS {fk_name}"
                ))
            except Exception:
                db.session.rollback()
        db.session.execute(text(
            "ALTER TABLE user_profile_history "
            "ADD CONSTRAINT user_profile_history_target_user_id_fkey "
            "FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL"
        ))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error making target_user_id nullable: {e}")


def _ensure_user_profile_history_columns(app):
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "user_profile_history" not in inspector.get_table_names():
            return

        existing = {col["name"] for col in inspector.get_columns("user_profile_history")}
        new_cols = {
            "change_type": "VARCHAR(50)",
            "changed_by_role": "VARCHAR(50)",
            "old_value": "VARCHAR(255)",
            "new_value": "VARCHAR(255)",
        }

        for col_name, col_type in new_cols.items():
            if col_name not in existing:
                db.session.execute(text(
                    f"ALTER TABLE user_profile_history "
                    f"ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                ))

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating user_profile_history columns: {e}")


def _ensure_request_is_edited_column(app):
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "requests" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("requests")}

        if "is_edited" not in columns:
            db.session.execute(text("""
                ALTER TABLE requests
                ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE
            """))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating requests table: {e}")


def _ensure_request_item_assigned_to_column(app):
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "request_items" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("request_items")}

        if "assigned_to_id" not in columns:
            db.session.execute(text("""
                ALTER TABLE request_items
                ADD COLUMN IF NOT EXISTS assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL
            """))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating request_items table: {e}")

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", "*"),
        supports_credentials=app.config.get("CORS_SUPPORTS_CREDENTIALS", True),
    )

    db.init_app(app)
    migrate.init_app(app, db)

    setup_logger(app)

    app.register_blueprint(health_bp, url_prefix="/api/v1/health")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(requests_bp, url_prefix="/api/v1/requests")
    app.register_blueprint(roles_bp, url_prefix="/api/v1/roles")
    app.register_blueprint(templates_bp, url_prefix="/api/v1/templates")
    app.register_blueprint(role_requests_bp)

    register_error_handlers(app)

    @app.route("/")
    def index():
        app.logger.info("Главная страница была запрошена")
        return {"status": "ok", "message": "Backend is running"}

    with app.app_context():
        import models  # noqa
        db.create_all()
        _migrate_remove_username_clean_db(app)
        _ensure_request_department_column(app)
        _ensure_request_item_work_status(app)
        _ensure_request_item_assigned_to_column(app)
        _ensure_request_is_edited_column(app)
        _ensure_user_stats_table(app)
        _ensure_request_templates_table(app)
        _ensure_deleted_requests_table(app)
        _ensure_role_change_requests_table(app)
        _ensure_role_change_request_type_column(app)
        _ensure_user_profile_history_target_nullable(app)
        _ensure_user_profile_history_columns(app)
        from models.user.role import seed_roles
        seed_roles()

    return app
