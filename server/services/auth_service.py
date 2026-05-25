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

        target_user.roles = [role]
        db.session.commit()
        return target_user

    @staticmethod
    def get_user_by_token(token):
        return User.query.filter_by(token=token).first()
