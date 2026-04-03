from extensions import db

class Author(db.Model):
    __tablename__ = "author"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(75), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    user = db.relationship("User", back_populates="author")
    
    def __repr__(self):
        return f"<Author {self.name}>"
