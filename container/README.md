# База данных и бэкапы — руководство

## Структура папки container/

```
container/
├── docker-compose.yml   — описание всех сервисов (postgres, backend, frontend, nginx, backup)
├── .env                 — пути к папкам данных БД и бэкапов
├── backup.sh            — скрипт автоматических ежедневных бэкапов
├── backups/             — сюда идут бэкапы по умолчанию, если BACKUP_PATH не задан
└── nginx/               — конфиг nginx
```

---

## Где хранятся данные PostgreSQL

По умолчанию данные хранятся во **внутреннем Docker-томе** `postgres_data`. Это значит, что данные живут внутри Docker и не видны как обычная папка, но переживают `docker compose down` и `docker compose up`.

Если нужно хранить данные в **конкретной папке на сервере** (например, для ручного бэкапа или переноса), нужно указать путь в `.env`:

```env
# container/.env

DB_DATA_PATH=/home/user/pantera/db-data
```

После этого данные PostgreSQL будут лежать в этой папке. Туда записывает сам Postgres — вручную ничего не трогать.

> Если `DB_DATA_PATH` пустой — используется внутренний том Docker. Если задан — папка на хосте.

---

## Автоматические бэкапы

Каждые 24 часа контейнер `backup` делает дамп базы командой `pg_dump` и сохраняет его в папку бэкапов.

### Где хранятся бэкапы

По умолчанию — в папке `container/backups/` рядом с `docker-compose.yml`.

Чтобы указать другое место, задай `BACKUP_PATH` в `.env`:

```env
# container/.env

BACKUP_PATH=/home/user/pantera/backups
```

Имена файлов: `backup_YYYY-MM-DD.sql`  
Пример: `backup_2026-07-12.sql`

> Старые файлы **не удаляются автоматически** — нужно чистить вручную. Каждый файл весит столько, сколько весит вся база.

### Когда делается первый бэкап

Скрипт сначала **ждёт 24 часа**, и только потом делает первый дамп. Это сделано намеренно — чтобы не нагружать систему сразу при старте. Если нужен бэкап прямо сейчас, см. раздел ниже.

### Как проверить, что бэкапы работают

```bash
docker logs pantera-backup-1
```

Если всё в порядке, в логах будут строки вида:
```
[backup] Сервис бэкапов запущен. Первый бэкап через 24 часа.
[backup] Готово: backup_2026-07-12.sql (4.2M)
```

---

## Как сделать бэкап вручную прямо сейчас

```bash
docker exec pantera-postgres-1 pg_dump -U pantera_user pantera > backup_manual.sql
```

Файл `backup_manual.sql` появится в текущей папке на хосте.

---

## Как восстановить базу из бэкапа

> Внимание: восстановление перезаписывает текущие данные.

```bash
docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < backup_2026-07-12.sql
```

Если нужно восстановить с нуля (пустая база):

```bash
# 1. Остановить backend, чтобы он не мешал
docker compose stop backend

# 2. Подключиться к postgres и очистить базу
docker exec -it pantera-postgres-1 psql -U pantera_user -d pantera -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Загрузить дамп
docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < backup_2026-07-12.sql

# 4. Запустить backend обратно
docker compose start backend
```

---

## Как перенести базу на другой сервер

1. Сделать бэкап на старом сервере:
   ```bash
   docker exec pantera-postgres-1 pg_dump -U pantera_user pantera > перенос.sql
   ```
2. Скопировать файл `перенос.sql` на новый сервер (например, через `scp`).
3. Запустить проект на новом сервере (`docker compose up -d`).
4. Восстановить базу:
   ```bash
   docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < перенос.sql
   ```

---

## Подключение к базе напрямую (для диагностики)

```bash
docker exec -it pantera-postgres-1 psql -U pantera_user -d pantera
```

Внутри можно выполнять обычные SQL-запросы:
```sql
\dt              -- список таблиц
\q               -- выйти
SELECT * FROM users LIMIT 10;
```

---

## Параметры подключения (внутри Docker-сети)

| Параметр | Значение        |
|----------|-----------------|
| Хост     | `postgres`      |
| Порт     | `5432`          |
| База     | `pantera`       |
| Юзер     | `pantera_user`  |
| Пароль   | `pantera_pass`  |

Снаружи Docker (если нужен прямой доступ) — хост `localhost`, порт `5432`.

---

## Быстрая шпаргалка

```bash
# Запустить всё
docker compose up -d

# Остановить всё (данные сохраняются)
docker compose down

# Посмотреть логи бэкапа
docker logs pantera-backup-1

# Бэкап прямо сейчас
docker exec pantera-postgres-1 pg_dump -U pantera_user pantera > backup_$(date +%Y-%m-%d).sql

# Восстановить из файла
docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < backup_2026-07-12.sql

# Зайти в базу напрямую
docker exec -it pantera-postgres-1 psql -U pantera_user -d pantera
```
