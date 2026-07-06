import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key-change-me"

    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DATABASE_URL")
        or "postgresql+psycopg2://username:password@localhost:5432/application_store"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False

    # CORS settings
    CORS_SUPPORTS_CREDENTIALS = True

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS",
            ",".join(
                [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://smb",
                    "http://smb:80",
                    "http://172.29.99.72",
                    "http://172.29.99.72:80",
                    "http://172.29.99.230",
                    "http://172.29.99.230:81",
                ]
            ),
        ).split(",")
        if origin.strip()
    ]

    # Pagination
    ITEMS_PER_PAGE = 14