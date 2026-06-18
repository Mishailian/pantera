from secrets import token_hex

from extensions import db
from models.user.user import User
from models.user.role import Role, EXTRA_ROLE_NAMES


class AuthService:

    @staticmethod
    def _get_role_or_raise(role_name: str) -> Role:
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found. Run 'flask seed-roles' first.")
        return role

    @staticmethod
    def create_user(password, full_name, role_name, number):
        if not password:
            raise ValueError("password is required")
        if not full_name:
            raise ValueError("full_name is required")
        if not role_name:
            raise ValueError("role_name is required")
        if not number:
            raise ValueError("number is required")

        if User.query.filter_by(number=number).first():
            raise ValueError("Пользователь с таким номером телефона уже существует")

        selected_role = AuthService._get_role_or_raise(role_name)
        if selected_role.name == "admin":
            raise ValueError("admin role is not available for self-registration")
        if selected_role.name in EXTRA_ROLE_NAMES:
            raise ValueError(f"role '{role_name}' is an extra role and cannot be self-registered")

        user = User(
            full_name=full_name,
            number=number,
            token=token_hex(32),
        )
        user.set_password(password)
        user.roles = [selected_role]

        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def authenticate_user(number, password):
        if not number or not password:
            return None

        user = User.query.filter_by(number=number).first()
        if not user:
            return None
        if not user.check_password(password):
            return None
        if not user.is_active:
            return None

        if not user.token:
            user.token = token_hex(32)
            db.session.commit()

        return user

    @staticmethod
    def get_users():
        return User.query.order_by(User.id.asc()).all()

    @staticmethod
    def get_user_by_id(user_id):
        return db.session.get(User, user_id)

    @staticmethod
    def assign_role(actor: User, target_user_id: int, role_name: str):
        if not actor.is_admin():
            raise PermissionError("Only admin can assign roles")

        target_user = db.session.get(User, target_user_id)
        if not target_user:
            raise ValueError(f"User {target_user_id} not found")

        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found")

        if role.name in EXTRA_ROLE_NAMES:
            raise ValueError(
                f"Роль '{role_name}' — доп. роль, назначается через extra-roles, а не как основная"
            )

        # Основная роль заменяется, но доп. роли (например director_approval) сохраняются
        extra_roles = [r for r in target_user.roles if r.name in EXTRA_ROLE_NAMES]
        target_user.roles = extra_roles + [role]
        db.session.commit()
        return target_user

    @staticmethod
    def set_extra_role(actor: User, target_user_id: int, role_name: str, enabled: bool):
        if not actor.is_admin():
            raise PermissionError("Only admin can manage extra roles")

        if role_name not in EXTRA_ROLE_NAMES:
            raise ValueError(f"'{role_name}' is not an extra role")

        target_user = db.session.get(User, target_user_id)
        if not target_user:
            raise ValueError(f"User {target_user_id} not found")

        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found")

        if enabled:
            target_user.add_role(role)
        else:
            target_user.remove_role(role)

        db.session.commit()
        return target_user

    @staticmethod
    def admin_exists(exclude_user_id=None):
        admin_role = Role.query.filter_by(name="admin").first()
        if not admin_role:
            return False
        return any(u.id != exclude_user_id for u in admin_role.users)

    @staticmethod
    def get_user_by_token(token):
        return User.query.filter_by(token=token).first()
