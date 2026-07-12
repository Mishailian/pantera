Настройка Linux-сервера в сети AD/DNS

Цель

Сервер Linux должен получать IP по DHCP, использовать корпоративный DNS и резолвиться по имени:

snb.ushz.local

⸻

1. Настройка hostname

sudo hostnamectl set-hostname snb

Проверка:

hostname
hostname -f

⸻

2. /etc/hosts

Открыть:

sudo nano /etc/hosts

Пример:

127.0.0.1 localhost
127.0.1.1 snb.ushz.local snb

⸻

3. Netplan через DHCP

Файл:

sudo nano /etc/netplan/99-custom.yaml

Пример:

network:
  version: 2
  ethernets:
    enp3s0:
      dhcp4: true
      dhcp-identifier: mac
      dhcp4-overrides:
        send-hostname: true
        use-dns: true
        use-domains: true

Применить:

sudo netplan try
sudo netplan apply
sudo systemctl restart systemd-networkd

Обновить DHCP lease:

sudo networkctl renew enp3s0

⸻

4. Проверка сети и DNS

networkctl status enp3s0
resolvectl status
ip a
ip route

Должно быть примерно:

Address: 172.29.99.x DHCP4
Gateway: 172.29.96.253
DNS: 172.29.99.1
Search Domains: ushz.local

Проверка DNS:

nslookup snb.ushz.local 172.29.99.1

или:

dig @172.29.99.1 snb.ushz.local

⸻

5. Если DNS-запись не появилась

Это обычно не проблема Linux. Значит DHCP/DNS не создаёт записи для Linux-клиентов.

Текст админу:

Linux-сервер получает IP по DHCP и использует DNS 172.29.99.1.
Hostname: snb
Но DNS-запись snb.ushz.local не создаётся.
Проверьте, пожалуйста:
- включены ли dynamic DNS updates на DHCP
- создаются ли записи для non-Windows клиентов
- нет ли ограничения secure updates only
Либо создайте вручную A-запись:
snb.ushz.local -> <IP_СЕРВЕРА>

⸻

6. Ввод Linux в домен через realm

Установка пакетов:

sudo apt update
sudo apt install realmd sssd adcli krb5-user samba-common-bin packagekit -y

Поиск домена:

realm discover ushz.local

Ввод в домен:

sudo realm join ushz.local -U <доменный_админ>

Проверка:

realm list

⸻

7. Смена имени после ввода в домен

Чистый вариант:

sudo realm leave ushz.local
sudo hostnamectl set-hostname snb
sudo nano /etc/hosts
sudo realm join ushz.local -U <доменный_админ>

После этого удалить старое в AD/DNS:

snab.ushz.local
SNAB computer object

⸻

8. Быстрая диагностика

Linux:

hostname
hostname -f
networkctl status enp3s0
resolvectl status
dig @172.29.99.1 snb.ushz.local

Windows:

ipconfig /all
ipconfig /flushdns
nslookup snb.ushz.local
ping snb.ushz.local

⸻

Главное

* netplan настраивает сеть, но не hostname.
* Hostname задаётся через hostnamectl.
* Linux по DHCP не всегда сам создаёт запись в AD DNS.
* Для авто-регистрации DNS нужна настройка DHCP/DNS или ввод Linux в домен.
* Самый простой рабочий вариант — ручная A-запись в DNS.

⸻

База данных и бэкапы

Структура папки container/

container/
├── docker-compose.yml   — описание всех сервисов (postgres, backend, frontend, nginx, backup)
├── .env                 — пути к папкам данных БД и бэкапов
├── backup.sh            — скрипт автоматических ежедневных бэкапов
├── backups/             — сюда идут бэкапы по умолчанию, если BACKUP_PATH не задан
└── nginx/               — конфиг nginx

Где хранятся данные PostgreSQL

По умолчанию данные хранятся во внутреннем Docker-томе postgres_data. Данные переживают docker compose down и docker compose up.

Чтобы хранить данные в конкретной папке на сервере, указать путь в .env:

    DB_DATA_PATH=/home/user/pantera/db-data

После этого данные PostgreSQL будут лежать в этой папке. Вручную ничего не трогать.

Если DB_DATA_PATH пустой — используется внутренний том Docker. Если задан — папка на хосте.

⸻

Автоматические бэкапы

Каждые 24 часа контейнер backup делает дамп базы через pg_dump и сохраняет в папку бэкапов.

Где хранятся бэкапы: по умолчанию в container/backups/. Указать другое место через .env:

    BACKUP_PATH=/home/user/pantera/backups

Имена файлов: backup_YYYY-MM-DD.sql (например backup_2026-07-12.sql).
Старые файлы не удаляются автоматически — нужно чистить вручную.

Первый бэкап делается через 24 часа после старта — намеренно. Если нужен прямо сейчас:

    docker exec pantera-postgres-1 pg_dump -U pantera_user pantera > backup_manual.sql

Проверить что бэкапы работают:

    docker logs pantera-backup-1

⸻

Восстановление из бэкапа

    docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < backup_2026-07-12.sql

С нуля (пустая база):

    docker compose stop backend
    docker exec -it pantera-postgres-1 psql -U pantera_user -d pantera -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < backup_2026-07-12.sql
    docker compose start backend

Перенос на другой сервер:

    # На старом сервере
    docker exec pantera-postgres-1 pg_dump -U pantera_user pantera > перенос.sql
    # Скопировать файл на новый сервер (scp), запустить проект, затем:
    docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < перенос.sql

⸻

Подключение к базе напрямую

    docker exec -it pantera-postgres-1 psql -U pantera_user -d pantera

Параметры подключения внутри Docker-сети:
  Хост: postgres | Порт: 5432 | База: pantera | Юзер: pantera_user | Пароль: pantera_pass

Снаружи Docker — хост localhost, порт 5432.

⸻

Быстрая шпаргалка

    docker compose up -d                                                               # запустить всё
    docker compose down                                                                # остановить (данные сохраняются)
    docker logs pantera-backup-1                                                       # логи бэкапа
    docker exec pantera-postgres-1 pg_dump -U pantera_user pantera > backup_$(date +%Y-%m-%d).sql  # бэкап сейчас
    docker exec -i pantera-postgres-1 psql -U pantera_user -d pantera < backup.sql    # восстановить
    docker exec -it pantera-postgres-1 psql -U pantera_user -d pantera                # зайти в базу
