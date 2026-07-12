#!/bin/bash
# Скрипт ежедневного бэкапа PostgreSQL
# Запускается внутри контейнера postgres:16

mkdir -p /backups

echo "[backup] Сервис бэкапов запущен. Первый бэкап через 24 часа."

while true; do
  sleep 86400

  FNAME="backup_$(date +%Y-%m-%d).sql"
  FPATH="/backups/$FNAME"

  if pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB" > "$FPATH"; then
    echo "[backup] Готово: $FNAME ($(du -sh "$FPATH" | cut -f1))"
  else
    echo "[backup] ОШИБКА: не удалось создать бэкап $FNAME" >&2
    rm -f "$FPATH"
  fi
done
