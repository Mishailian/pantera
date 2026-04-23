import os
import logging
from logging.handlers import RotatingFileHandler
from flask import request

def setup_logger(app):
    # Создаем папку logs, если ее нет
    if not os.path.exists("logs"):
        os.makedirs("logs")

    # Настраиваем ротацию логов: файлы по 10 МБ, храним последние 10 штук
    file_handler = RotatingFileHandler(
        "logs/backend.log", maxBytes=10 * 1024 * 1024, backupCount=10
    )
    
    # Формат лога: [Время] УРОВЕНЬ | Модуль | Сообщение
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s | %(module)s | %(message)s"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    # Добавляем обработчик к логгеру приложения Flask
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    
    # Чтобы логи не дублировались в консоли докера дважды, если там уже есть базовый логгер
    app.logger.propagate = False 

    # Хук, который срабатывает после каждого обработанного запроса
    @app.after_request
    def log_request(response):
        # Опционально: можно игнорировать частые health-чеки, чтобы не спамить
        if request.path == "/api/v1/health":
            return response

        # Пытаемся получить реальный IP клиента (учитывая, что запросы идут через Nginx)
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        
        # Логируем инфу о запросе
        app.logger.info(
            f"{ip} - {request.method} {request.path} - Status: {response.status_code}"
        )
        return response