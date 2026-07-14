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
    {"name": "supply_manager", "description": "Отдел снабжения"},
    {"name": "supply_head",    "description": "Начальник отдела снабжения"},
    {"name": "rezo_department","description": "Отдел Резо"},
    {"name": "rezo_head",      "description": "Начальник отдела Резо"},
    {"name": "it_department",  "description": "ОИТ"},
    {"name": "it_head",        "description": "Начальник ОИТ"},
    {"name": "directorate",    "description": "Дирекция"},
    {"name": "main_accounting_department",             "description": "Главная бухгалтерия"},
    {"name": "legal_department",                       "description": "Юридический отдел"},
    {"name": "planning_and_economic_department",       "description": "Планово-экономический отдел"},
    {"name": "finance_department",                     "description": "Финансовый отдел"},
    {"name": "sales_department",                       "description": "Отдел сбыта"},
    {"name": "hr_department",                          "description": "Отдел по управлению персоналом"},
    {"name": "special_department",                     "description": "Специальный отдел"},
    {"name": "technical_control_department",           "description": "ОТК"},
    {"name": "labor_protection",                       "description": "Бюро охраны труда и промышленной безопасности"},
    {"name": "design_and_technology_department",       "description": "Конструкторско-технологический отдел"},
    {"name": "factory_laboratory",                     "description": "ЗЛ"},
    {"name": "machine_shop",                           "description": "МЦ"},
    {"name": "tire_manufacturing_preparatory_workshop","description": "Подготовительный цех шинного производства"},
    {"name": "security_service",                       "description": "Служба безопасности"},
    {"name": "electricians",                           "description": "Служба главного энергетика"},
    {"name": "department_metrology",                   "description": "Отдел метрологии"},
    {"name": "mechanics",                              "description": "Служба главного механика"},
    {"name": "repairmen",                              "description": "РСГ"},
    {"name": "steam_supply_shop",                      "description": "ЦПВС"},
    {"name": "tire_manufacturing",                     "description": "Шинное производство"},
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