from app.extensions import db
from app.models.tag_post import Tag_post

undeclared_storage_tags = db.Table(
    "undeclared_storage_tags",
    db.Column("storage_id", db.Integer, db.ForeignKey("undeclared_temporary_storage.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag_post.id"), primary_key=True),
)

class Undeclared_temporary_storage(db.Model):
    __tablename__ = "undeclared_temporary_storage"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price_id = db.Column(db.String(255), nullable=True)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    tags = db.relationship(Tag_post, secondary=undeclared_storage_tags, backref="undeclared_storages")
    
    def __repr__(self):
        return f"<Undeclared_temporary_storage {self.name}>"
