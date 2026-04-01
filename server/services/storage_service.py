from extensions import db
from models.temporary_storage import Temporary_storage
from models.undeclared_temporary_storage import Undeclared_temporary_storage
from models.archive import Archive
from models.tag_post import Tag_post
from models.executor import Executor
from utils.serializers import serialize_temporary_storage, serialize_undeclared_storage, serialize_archive, serialize_tag, serialize_executor


class StorageService:
    ITEMS_PER_PAGE = 14
    
    @staticmethod
    def get_temporary_storages(page=0):
        """Список temporary_storage с пагинацией"""
        start, end = StorageService._calculate_page(page)
        storages = Temporary_storage.query.slice(start, end).all()
        return storages
    
    @staticmethod
    def get_temporary_storage_by_id(storage_id):
        """Получить temporary_storage по ID"""
        return db.session.get(Temporary_storage, storage_id)
    
    @staticmethod
    def create_temporary_storage(name, price_id=None, tags=None):
        """Создать temporary_storage"""
        storage = Temporary_storage(name=name, price_id=price_id)
        
        if tags:
            tag_objects = Tag_post.query.filter(Tag_post.id.in_(tags)).all()
            storage.tags = tag_objects
        
        db.session.add(storage)
        db.session.commit()
        return storage
    
    @staticmethod
    def update_temporary_storage(storage_id, **kwargs):
        """Обновить temporary_storage"""
        storage = StorageService.get_temporary_storage_by_id(storage_id)
        if not storage:
            return None
        
        for key, value in kwargs.items():
            if hasattr(storage, key):
                setattr(storage, key)
        
        db.session.commit()
        return storage
    
    @staticmethod
    def _calculate_page(page):
        """Вычисление границ страницы"""
        page = int(page)
        start = page * StorageService.ITEMS_PER_PAGE
        end = start + StorageService.ITEMS_PER_PAGE
        return start, end
    
    # Аналогичные методы для undeclared_storage и archive
    @staticmethod
    def get_undeclared_storages(page=0):
        start, end = StorageService._calculate_page(page)
        return Undeclared_temporary_storage.query.slice(start, end).all()
    
    @staticmethod
    def get_archive_items(page=0):
        start, end = StorageService._calculate_page(page)
        return Archive.query.slice(start, end).all()
    
    @staticmethod
    def get_tags():
        return Tag_post.query.all()
    
    @staticmethod
    def get_tag_by_id(tag_id):
        return db.session.get(Tag_post, tag_id)
    
    @staticmethod
    def create_tag(name):
        tag = Tag_post(name=name)
        db.session.add(tag)
        db.session.commit()
        return tag
    
    @staticmethod
    def get_executors():
        return Executor.query.all()
