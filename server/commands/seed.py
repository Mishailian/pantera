from sqlalchemy.dialects.postgresql import insert

from extensions import db
from models.user.role import Role, INITIAL_ROLES


def seed_roles() -> None:
    statement = insert(Role).values(INITIAL_ROLES)

    statement = statement.on_conflict_do_update(
        index_elements=[Role.name],
        set_={
            "description": statement.excluded.description,
        },
    )

    try:
        db.session.execute(statement)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
