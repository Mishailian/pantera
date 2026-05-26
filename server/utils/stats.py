from extensions import db
from models.stats.user_stats import UserStats


def increment_stat(user_id, field, amount=1):
    """Увеличивает счётчик в user_stats для указанного пользователя."""
    if not user_id:
        return
    try:
        stats = UserStats.query.filter_by(user_id=user_id).with_for_update().first()
        if not stats:
            stats = UserStats(user_id=user_id)
            db.session.add(stats)
            db.session.flush()
        current = getattr(stats, field, 0) or 0
        setattr(stats, field, current + amount)
    except Exception:
        pass  # не ломаем основной флоу если статистика не записалась
