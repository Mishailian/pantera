from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, migrate

from routes.health import health_bp
from routes.auth import auth_bp
from routes.tags import tags_bp
from routes.users import users_bp
from routes.request import requests_bp

from errors.handlers import register_error_handlers


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

    app.register_blueprint(health_bp, url_prefix="/api/v1/health")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(tags_bp, url_prefix="/api/v1/tags")
    app.register_blueprint(requests_bp, url_prefix="/api/v1/requests")

    register_error_handlers(app)

    @app.route("/")
    def index():
        return {"status": "ok", "message": "Backend is running"}

    with app.app_context():
        import models  # noqa
        db.create_all()

    return app
