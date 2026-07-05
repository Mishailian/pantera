from datetime import datetime
from extensions import db


class DeletedRequest(db.Model):
    __tablename__ = "deleted_requests"

    id = db.Column(db.Integer, primary_key=True)
    original_id = db.Column(db.Integer, nullable=False)
    deleted_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    reason = db.Column(db.Text, nullable=True)
    snapshot = db.Column(db.JSON, nullable=False)

    deleted_by = db.relationship("User", foreign_keys=[deleted_by_id], lazy="selectin")
