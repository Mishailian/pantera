from datetime import datetime
from extensions import db

class UserProfileHistory(db.Model):
    __tablename__ = "user_profile_history"

    id = db.Column(db.Integer, primary_key=True)
    target_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    changed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    old_full_name = db.Column(db.String(150), nullable=True)
    new_full_name = db.Column(db.String(150), nullable=True)
    old_role_name = db.Column(db.String(50), nullable=True)
    new_role_name = db.Column(db.String(50), nullable=True)
    changed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)