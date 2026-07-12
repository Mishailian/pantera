from datetime import datetime
from extensions import db


class RoleChangeRequest(db.Model):
    __tablename__ = "role_change_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    requested_role = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    request_type = db.Column(db.String(20), nullable=False, default="role_change")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    reviewed_by_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", foreign_keys=[user_id], lazy="selectin")
    reviewed_by = db.relationship("User", foreign_keys=[reviewed_by_id], lazy="selectin")
