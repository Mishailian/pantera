from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)

@health_bp.get("/")
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Flask backend is running",
        "version": "1.0.0"
    })
