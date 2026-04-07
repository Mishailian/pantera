from extensions import db


user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)

    users = db.relationship(
        "User",
        secondary=user_roles,
        back_populates="roles",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Role id={self.id} name={self.name}>"


# ──────────────────────────────────────────────
# Seed: вызывается из create_app после db.create_all()
# Безопасно запускать повторно — дубликаты не создаются
# ──────────────────────────────────────────────

INITIAL_ROLES = [
    {"name": "admin",          "description": "Полный доступ, управление пользователями"},
    {"name": "supply_manager", "description": "Управление заявками на снабжение"},
    {"name": "default",        "description": "Базовый доступ"},
]


def seed_roles():
    created = []
    for role_data in INITIAL_ROLES:
        exists = Role.query.filter_by(name=role_data["name"]).first()
        if not exists:
            db.session.add(Role(**role_data))
            created.append(role_data["name"])

    if created:
        db.session.commit()
        print(f"[seed_roles] Созданы роли: {', '.join(created)}")
    else:
        print("[seed_roles] Роли уже существуют, пропускаем")