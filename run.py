#!/usr/bin/env python3
"""
Запуск Flask приложения
"""
from app.__init__ import create_app

flask_app = create_app()

if __name__ == "__main__":
    flask_app.run(debug=True)
