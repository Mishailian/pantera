from flask import Flask, jsonify
from flask_cors import CORS

from project.settings import Config
from temporary_storage.models import db
from temporary_storage.views import api_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=app.config["CORS_SUPPORTS_CREDENTIALS"],
    )

    db.init_app(app)
    app.register_blueprint(api_bp, url_prefix="/api/v1")

    @app.route("/")
    def index():
        return jsonify({
            "status": "ok",
            "message": "Flask backend is running"
        })

    with app.app_context():
        db.create_all()

    return app


app = create_app()
