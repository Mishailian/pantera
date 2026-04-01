from app.extensions import db

class Tag_post(db.Model):
    __tablename__ = "tag_post"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    
    def __repr__(self):
        return f"<Tag_post {self.name}>"
