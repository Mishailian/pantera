from extensions import db
from models.tag.tag_post import Tag_post


class TagService:
    @staticmethod
    def get_tags():
        return Tag_post.query.order_by(Tag_post.name.asc()).all()

    @staticmethod
    def get_tag_by_id(tag_id):
        return db.session.get(Tag_post, tag_id)

    @staticmethod
    def get_tag_by_name(name):
        if not name:
            return None
        return Tag_post.query.filter_by(name=name).first()

    @staticmethod
    def create_tag(name):
        if not name:
            raise ValueError("Tag name is required")

        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("Tag name is required")

        existing_tag = TagService.get_tag_by_name(normalized_name)
        if existing_tag:
            raise ValueError("Tag with this name already exists")

        tag = Tag_post(name=normalized_name)
        db.session.add(tag)
        db.session.commit()
        return tag

    @staticmethod
    def update_tag(tag_id, name):
        tag = TagService.get_tag_by_id(tag_id)
        if not tag:
            return None

        if not name:
            raise ValueError("Tag name is required")

        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("Tag name is required")

        existing_tag = TagService.get_tag_by_name(normalized_name)
        if existing_tag and existing_tag.id != tag.id:
            raise ValueError("Tag with this name already exists")

        tag.name = normalized_name
        db.session.commit()
        return tag

    @staticmethod
    def delete_tag(tag_id):
        tag = TagService.get_tag_by_id(tag_id)
        if not tag:
            return False

        db.session.delete(tag)
        db.session.commit()
        return True
