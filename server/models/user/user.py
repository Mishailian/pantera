# models/user/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models.user.role import user_roles


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    full_name = db.Column(db.String(150), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    token = db.Column(db.String(255), unique=True, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    roles = db.relationship(
        "Role",
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def has_role(self, role_name: str) -> bool:
        return any(role.name == role_name for role in self.roles)

    def is_admin(self) -> bool:
        return self.has_role("admin")

    def add_role(self, role) -> None:
        if role not in self.roles:
            self.roles.append(role)

    def remove_role(self, role) -> None:
        if role in self.roles:
            self.roles.remove(role)

    def __repr__(self):
        return f"<User id={self.id} username={self.username}>"