from extensions import db

class Executor(db.Model):
    __tablename__ = "executor"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(45), unique=True, nullable=False)
    
    def __repr__(self):
        return f"<Executor {self.name}>"
