from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, migrate
from routes.health import health_bp
from routes.auth import auth_bp
from routes.temporary_storage import temporary_storage_bp
from routes.archive import archive_bp
from routes.tags import tags_bp
from routes.users import users_bp
from routes.undeclared import undeclared_bp
from errors.handlers import register_error_handlers


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=app.config["CORS_SUPPORTS_CREDENTIALS"]
    )

    db.init_app(app)
    migrate.init_app(app, db)

    # НОВЫЕ пути
    app.register_blueprint(health_bp, url_prefix="/api/v1/health")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(temporary_storage_bp, url_prefix="/api/v1/temporary-storage")
    app.register_blueprint(archive_bp, url_prefix="/api/v1/archive")

    # СТАРЫЕ Django пути
    app.register_blueprint(temporary_storage_bp, url_prefix="/api/v1", name="store_api")

    # ДОПОЛНИТЕЛЬНЫЕ маршруты
    app.register_blueprint(tags_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(undeclared_bp)

    register_error_handlers(app)

    @app.route("/")
    def index():
        return {"status": "ok", "message": "Backend is running"}

    with app.app_context():
        import models  # ← ВАЖНО: убрали app.
        db.create_all()

    return app