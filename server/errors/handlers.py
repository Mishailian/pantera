from flask import jsonify
from werkzeug.exceptions import NotFound, BadRequest

def register_error_handlers(app):
    """Регистрация обработчиков ошибок"""
    
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
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "Something went wrong on the server"
        }), 500
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        return jsonify({
            "error": "Server Error",
            "message": "An unexpected error occurred"
        }), 500
