from extensions import db
from models.tag_post import Tag_post

temporary_storage_tags = db.Table(
    "temporary_storage_tags",
    db.Column("storage_id", db.Integer, db.ForeignKey("temporary_storage.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag_post.id"), primary_key=True),
)

class Temporary_storage(db.Model):
    __tablename__ = "temporary_storage"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price_id = db.Column(db.String(255), nullable=True)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    tags = db.relationship(Tag_post, secondary=temporary_storage_tags, backref="temporary_storages")
    
    def __repr__(self):
        return f"<Temporary_storage {self.name}>"
