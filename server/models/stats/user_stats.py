from datetime import datetime
from extensions import db


class UserStats(db.Model):
    __tablename__ = "user_stats"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Как создатель заявок
    requests_created = db.Column(db.Integer, default=0, nullable=False)
    requests_deleted = db.Column(db.Integer, default=0, nullable=False)
    requests_approved = db.Column(db.Integer, default=0, nullable=False)
    requests_archived = db.Column(db.Integer, default=0, nullable=False)

    # Как снабженец (исполнитель)
    requests_assigned_to_me = db.Column(db.Integer, default=0, nullable=False)
    requests_signed_by_me = db.Column(db.Integer, default=0, nullable=False)
    requests_archived_by_me = db.Column(db.Integer, default=0, nullable=False)

    # Изменения профиля
    phone_changes = db.Column(db.Integer, default=0, nullable=False)
    name_changes = db.Column(db.Integer, default=0, nullable=False)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def __repr__(self):
        return f"<UserStats user_id={self.user_id}>"
