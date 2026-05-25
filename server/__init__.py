from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, migrate

from routes.health import health_bp
from routes.auth import auth_bp
from routes.tags import tags_bp
from routes.users import users_bp
from routes.request import requests_bp
from routes.roles import roles_bp
from errors.handlers import register_error_handlers
from utils.logger import setup_logger


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
    """
    Удаляет поле username, делает number уникальным.
    Удаляет только пользователей без номера телефона.
    Все остальные данные (заявки и т.д.) сохраняются.
    Запускается один раз.
    """
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "users" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("users")}

        if "username" not in columns:
            return  # уже мигрировано

        # Находим пользователей без номера телефона
        result = db.session.execute(
            text("SELECT id FROM users WHERE number IS NULL OR TRIM(number) = ''")
        )
        no_phone_ids = [row[0] for row in result.fetchall()]

        if no_phone_ids:
            ids = ",".join(str(i) for i in no_phone_ids)

            # Обнуляем все FK-ссылки на удаляемых пользователей в requests
            for col in ("created_by_id", "approved_by_id", "archived_by_id",
                        "assigned_to_id", "assigned_to_at_archive_id"):
                db.session.execute(text(
                    f"UPDATE requests SET {col} = NULL WHERE {col} IN ({ids})"
                ))

            # Обнуляем в request_items
            db.session.execute(text(
                f"UPDATE request_items SET assigned_to_id = NULL WHERE assigned_to_id IN ({ids})"
            ))

            # Обнуляем в request_status_history
            db.session.execute(text(
                f"UPDATE request_status_history SET changed_by_id = NULL WHERE changed_by_id IN ({ids})"
            ))

            # В user_profile_history: удаляем записи о самих удаляемых юзерах,
            # в остальных записях обнуляем changed_by
            db.session.execute(text(
                f"DELETE FROM user_profile_history WHERE target_user_id IN ({ids})"
            ))
            db.session.execute(text(
                f"UPDATE user_profile_history SET changed_by_user_id = NULL WHERE changed_by_user_id IN ({ids})"
            ))

            # Удаляем роли этих пользователей
            db.session.execute(text(
                f"DELETE FROM user_roles WHERE user_id IN ({ids})"
            ))

            # Удаляем самих пользователей
            db.session.execute(text(
                f"DELETE FROM users WHERE id IN ({ids})"
            ))

            db.session.commit()

        # Убираем колонку username
        db.session.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS username"))
        db.session.commit()

        # Делаем number NOT NULL и UNIQUE
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

    # Инициализируем логирование
    setup_logger(app)

    app.register_blueprint(health_bp, url_prefix="/api/v1/health")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(tags_bp, url_prefix="/api/v1/tags")
    app.register_blueprint(requests_bp, url_prefix="/api/v1/requests")
    app.register_blueprint(roles_bp, url_prefix="/api/v1/roles")

    register_error_handlers(app)

    @app.route("/")
    def index():
        app.logger.info("Главная страница была запрошена")
        return {"status": "ok", "message": "Backend is running"}

    with app.app_context():
        import models  # noqa
        db.create_all()
        _migrate_remove_username_clean_db(app)
        _ensure_request_item_work_status(app)
        _ensure_request_item_assigned_to_column(app)
        from models.user.role import seed_roles
        seed_roles()

    return app