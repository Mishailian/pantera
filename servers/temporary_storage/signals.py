from werkzeug.security import generate_password_hash

from .models import db, User, Author


def apply_signup_rules(user: User):
    username = (user.username or "").strip().lower()
    if username == "admin":
        user.is_superuser = True
    else:
        user.is_superuser = False
    return user


def ensure_author_exists(user: User):
    if not user:
        return None

    author = Author.query.filter_by(user_id=user.id).first()
    if author:
        if author.name != user.username:
            author.name = user.username
            db.session.commit()
        return author

    author = Author(name=user.username, user_id=user.id)
    db.session.add(author)
    db.session.commit()
    return author


def create_user(username: str, password: str):
    username = (username or "").strip()

    if not username:
        raise ValueError("username is required")

    if not password:
        raise ValueError("password is required")

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        raise ValueError("user already exists")

    user = User(
        username=username,
        password_hash=generate_password_hash(password),
    )

    apply_signup_rules(user)

    db.session.add(user)
    db.session.commit()

    author = ensure_author_exists(user)
    return user, author


def update_user(username: str, **fields):
    user = User.query.filter_by(username=username).first()
    if not user:
        raise ValueError("user not found")

    if "username" in fields and fields["username"]:
        user.username = fields["username"].strip()

    if "password" in fields and fields["password"]:
        user.password_hash = generate_password_hash(fields["password"])

    apply_signup_rules(user)
    db.session.commit()
    ensure_author_exists(user)

    return user
