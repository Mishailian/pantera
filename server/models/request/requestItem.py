from datetime import datetime

from extensions import db


class RequestItem(db.Model):
    __tablename__ = "request_items"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("requests.id", ondelete="CASCADE"), nullable=False, index=True)

    name = db.Column(db.String(255), nullable=False)
    unit = db.Column(db.String(64), nullable=False)
    quantity = db.Column(db.Numeric(12, 3), nullable=False)
    description = db.Column(db.Text, nullable=True)

    is_done = db.Column(db.Boolean, default=False, nullable=False)
    work_status = db.Column(db.String(32), nullable=False, default="in_progress", index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    request = db.relationship("Request", back_populates="items")

    def __init__(self, **kwargs):
        # Безопасный конструктор: проглатываем поля, если они переданы правильно
        super(RequestItem, self).__init__(**kwargs)

    def __repr__(self):
        return f"<RequestItem id={self.id} name={self.name}>"