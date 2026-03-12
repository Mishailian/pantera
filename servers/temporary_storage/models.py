from datetime import date
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import declared_attr

db = SQLAlchemy()


temporary_storage_tags = db.Table(
    "temporary_storage_tags",
    db.Column("storage_id", db.Integer, db.ForeignKey("temporary_storage.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag_post.id"), primary_key=True),
)

undeclared_storage_tags = db.Table(
    "undeclared_storage_tags",
    db.Column("storage_id", db.Integer, db.ForeignKey("undeclared_temporary_storage.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag_post.id"), primary_key=True),
)

archive_storage_tags = db.Table(
    "archive_storage_tags",
    db.Column("storage_id", db.Integer, db.ForeignKey("archive.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag_post.id"), primary_key=True),
)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_superuser = db.Column(db.Boolean, default=False, nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=True)

    author = db.relationship(
        "Author",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User {self.username}>"


class Tag_post(db.Model):
    __tablename__ = "tag_post"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def __str__(self):
        return self.name


class Executor(db.Model):
    __tablename__ = "executor"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(45), unique=True, nullable=False)

    def __str__(self):
        return self.name


class Author(db.Model):
    __tablename__ = "author"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(75), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    user = db.relationship("User", back_populates="author")

    def __str__(self):
        return self.name


class BaseStorageMixin:
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price_id = db.Column(db.String(255), nullable=True)
    date_create = db.Column(db.Date, default=date.today, nullable=False)
    data_dead_line = db.Column(db.Date, nullable=True)
    data_update = db.Column(db.Date, default=date.today, onupdate=date.today, nullable=False)
    about = db.Column(db.JSON, nullable=True)

    @declared_attr
    def author_id(cls):
        return db.Column(db.Integer, db.ForeignKey("author.id", ondelete="RESTRICT"), nullable=True)

    @declared_attr
    def executor_id(cls):
        return db.Column(db.Integer, db.ForeignKey("executor.id", ondelete="RESTRICT"), nullable=True)

    @declared_attr
    def author(cls):
        return db.relationship("Author")

    @declared_attr
    def executor(cls):
        return db.relationship("Executor")


def _copy_storage_fields(source_obj, target_cls):
    new_obj = target_cls(
        name=source_obj.name,
        price_id=source_obj.price_id,
        data_dead_line=source_obj.data_dead_line,
        about=source_obj.about,
        author=source_obj.author,
        executor=source_obj.executor,
    )
    new_obj.tags = list(source_obj.tags)
    return new_obj


class Temporary_storage(BaseStorageMixin, db.Model):
    __tablename__ = "temporary_storage"

    tags = db.relationship(
        "Tag_post",
        secondary=temporary_storage_tags,
        lazy="joined",
    )

    @staticmethod
    def archivete(pk):
        obj = Temporary_storage.query.get(pk)
        if not obj:
            raise ValueError("Temporary_storage object not found")

        archived_obj = _copy_storage_fields(obj, Archive)
        db.session.add(archived_obj)
        db.session.delete(obj)
        db.session.commit()
        return archived_obj


class Undeclared_temporary_storage(BaseStorageMixin, db.Model):
    __tablename__ = "undeclared_temporary_storage"

    tags = db.relationship(
        "Tag_post",
        secondary=undeclared_storage_tags,
        lazy="joined",
    )

    @classmethod
    def declared(cls, pk):
        obj = cls.query.get(pk)
        if not obj:
            raise ValueError("Undeclared_temporary_storage object not found")

        new_obj = _copy_storage_fields(obj, Temporary_storage)
        db.session.add(new_obj)
        db.session.delete(obj)
        db.session.commit()
        return new_obj


class Archive(BaseStorageMixin, db.Model):
    __tablename__ = "archive"

    tags = db.relationship(
        "Tag_post",
        secondary=archive_storage_tags,
        lazy="joined",
    )

    @staticmethod
    def dearchivete(pk):
        obj = Archive.query.get(pk)
        if not obj:
            raise ValueError("Archive object not found")

        restored_obj = _copy_storage_fields(obj, Temporary_storage)
        db.session.add(restored_obj)
        db.session.delete(obj)
        db.session.commit()
        return restored_obj
