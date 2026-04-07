from flask import jsonify
from werkzeug.exceptions import HTTPException, NotFound, BadRequest


def register_error_handlers(app):
    @app.errorhandler(NotFound)
    def handle_not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "Requested resource not found"
        }), 404

    @app.errorhandler(BadRequest)
    def handle_bad_request(error):
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid request data"
        }), 400

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({
            "error": error.name,
            "message": error.description
        }), error.code

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        app.logger.exception(error)  # ← главное: пишем traceback в лог

        return jsonify({
            "error": type(error).__name__,
            "message": str(error)
        }), 500