from datetime import datetime
from extensions import db


class RequestTemplate(db.Model):
    __tablename__ = "request_templates"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    comment = db.Column(db.Text, nullable=True)
    items = db.Column(db.JSON, nullable=False, default=list)
    signers = db.Column(db.JSON, nullable=False, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<RequestTemplate id={self.id} user_id={self.user_id}>"
