from datetime import datetime
from extensions import db


class UserProfileHistory(db.Model):
    __tablename__ = "user_profile_history"

    id = db.Column(db.Integer, primary_key=True)
    target_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Тип изменения: name / phone / role / password
    change_type = db.Column(db.String(50), nullable=True)
    # Кто изменил: self / admin / it_department / it_head / supply_head
    changed_by_role = db.Column(db.String(50), nullable=True)

    # Для изменений имени (backward compat)
    old_full_name = db.Column(db.String(150), nullable=True)
    new_full_name = db.Column(db.String(150), nullable=True)

    # Для изменений ролей (backward compat)
    old_role_name = db.Column(db.String(50), nullable=True)
    new_role_name = db.Column(db.String(50), nullable=True)

    # Универсальные поля для phone / role / password
    old_value = db.Column(db.String(255), nullable=True)
    new_value = db.Column(db.String(255), nullable=True)

    changed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
