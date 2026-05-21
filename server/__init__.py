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

def _ensure_users_number_column(app):
    try:
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        if "users" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("users")}

        if "number" not in columns:
            db.session.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS number VARCHAR(50)
            """))
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating users table: {e}")


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
        _ensure_request_item_work_status(app)
        _ensure_users_number_column(app)
        _ensure_request_item_assigned_to_column(app)
        from models.user.role import seed_roles
        seed_roles()

    return app