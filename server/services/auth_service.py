from secrets import token_hex

from extensions import db
from models.user.user import User
from models.user.role import Role


class AuthService:
    @staticmethod
    def create_user(username, password, full_name, role_names=None, is_superuser=False):
        if not username:
            raise ValueError("username is required")

        if not password:
            raise ValueError("password is required")

        if not full_name:
            raise ValueError("full_name is required")

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            raise ValueError("User with this username already exists")

        user = User(
            username=username,
            full_name=full_name,
            is_superuser=is_superuser,
            token=token_hex(32),
        )
        user.set_password(password)

        if role_names:
            roles = Role.query.filter(Role.name.in_(role_names)).all()
            found_role_names = {role.name for role in roles}
            missing_roles = set(role_names) - found_role_names

            if missing_roles:
                raise ValueError(f"Roles not found: {', '.join(sorted(missing_roles))}")

            user.roles = roles

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
    def assign_roles(user_id, role_names):
        user = db.session.get(User, user_id)
        if not user:
            return None

        roles = Role.query.filter(Role.name.in_(role_names)).all()
        found_role_names = {role.name for role in roles}
        missing_roles = set(role_names) - found_role_names

        if missing_roles:
            raise ValueError(f"Roles not found: {', '.join(sorted(missing_roles))}")

        user.roles = roles
        db.session.commit()
        return user
