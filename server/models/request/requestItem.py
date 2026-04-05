from extensions import db
from datetime import datetime


class RequestItem(db.Model):
    __tablename__ = "request_items"

    id = db.Column(db.Integer, primary_key=True)

    request_id = db.Column(db.Integer, db.ForeignKey("requests.id"), nullable=False, index=True)

    name = db.Column(db.String(255), nullable=False)
    unit = db.Column(db.String(64), nullable=False)
    quantity = db.Column(db.Numeric(12, 3), nullable=False)
    description = db.Column(db.Text, nullable=True)

    is_done = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    request = db.relationship("Request", back_populates="items")

    def __repr__(self):
        return f"<RequestItem id={self.id} name={self.name}>"
