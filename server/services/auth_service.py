from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models.user import User
from models.author import Author
from secrets import token_hex


class AuthService:
    @staticmethod
    def create_user(username, password, author_name=None):
        """Создаёт пользователя с автором"""
        if User.query.filter_by(username=username).first():
            raise ValueError("User with this username already exists")
        
        user = User(
            username=username,
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.flush()  # Получаем user.id
        
        if author_name:
            author = Author(name=author_name, user_id=user.id)
            db.session.add(author)
        
        db.session.commit()
        return user
    
    @staticmethod
    def authenticate_user(username, password):
        """Аутентификация пользователя"""
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            if not user.token:
                user.token = token_hex(32)
                db.session.commit()
            return user
        return None
    
    @staticmethod
    def get_users():
        """Получить всех пользователей"""
        return User.query.all()
    
    @staticmethod
    def get_user_by_id(user_id):
        """Получить пользователя по ID"""
        return db.session.get(User, user_id)
