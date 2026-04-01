from app.extensions import db
from app.models.tag_post import Tag_post

archive_storage_tags = db.Table(
    "archive_storage_tags",
    db.Column("storage_id", db.Integer, db.ForeignKey("archive.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag_post.id"), primary_key=True),
)

class Archive(db.Model):
    __tablename__ = "archive"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price_id = db.Column(db.String(255), nullable=True)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    tags = db.relationship(Tag_post, secondary=archive_storage_tags, backref="archives")
    
    def __repr__(self):
        return f"<Archive {self.name}>"
