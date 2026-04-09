from extensions import db
from datetime import datetime



class Request(db.Model):
    __tablename__ = "requests"


    id = db.Column(db.Integer, primary_key=True)


    status = db.Column(db.String(32), nullable=False, default="undeclared", index=True)
    comment = db.Column(db.Text, nullable=True)


    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    archived_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)


    approved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    archived_at = db.Column(db.DateTime, nullable=True)


    created_by = db.relationship(
        "User",
        foreign_keys=[created_by_id],
        lazy="selectin",
    )


    approved_by = db.relationship(
        "User",
        foreign_keys=[approved_by_id],
        lazy="selectin",
    )

    archived_by = db.relationship(
        "User",
        foreign_keys=[archived_by_id],
        lazy="selectin",
    )


    items = db.relationship(
        "RequestItem",
        back_populates="request",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


    def __repr__(self):
        return f"<Request id={self.id} status={self.status}>"
