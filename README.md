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
