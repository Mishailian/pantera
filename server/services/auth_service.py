# services/auth_service.py
from secrets import token_hex

from extensions import db
from models.user.user import User
from models.user.role import Role


class AuthService:

    @staticmethod
    def _get_role_or_raise(role_name: str) -> Role:
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found. Run 'flask seed-roles' first.")
        return role

    @staticmethod
    def create_user(username, password, full_name):
        """
        Регистрация нового пользователя.
        Роль 'default' выдаётся автоматически.
        """
        if not username:
            raise ValueError("username is required")
        if not password:
            raise ValueError("password is required")
        if not full_name:
            raise ValueError("full_name is required")

        if User.query.filter_by(username=username).first():
            raise ValueError("User with this username already exists")

        default_role = AuthService._get_role_or_raise("default")

        user = User(
            username=username,
            full_name=full_name,
            token=token_hex(32),
        )
        user.set_password(password)
        user.roles = [default_role]

        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def authenticate_user(username, password):
        if not username or not password:
            return None

        user = User.query.filter_by(username=username).first()
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
    def get_user_by_username(username):
        return User.query.filter_by(username=username).first()

    @staticmethod
    def assign_roles(actor: User, target_user_id: int, role_names: list[str]):
        """
        Назначить роли пользователю.
        actor    — кто выполняет действие (должен быть admin).
        target_user_id — кому назначаем роли.
        role_names — список имён ролей, ПОЛНОСТЬЮ заменяет текущие.
        """
        if not actor.is_admin():
            raise PermissionError("Only admin can assign roles")

        target_user = db.session.get(User, target_user_id)
        if not target_user:
            raise ValueError(f"User {target_user_id} not found")

        roles = Role.query.filter(Role.name.in_(role_names)).all()
        found_names = {r.name for r in roles}
        missing = set(role_names) - found_names
        if missing:
            raise ValueError(f"Roles not found: {', '.join(sorted(missing))}")

        target_user.roles = roles
        db.session.commit()
        return target_user