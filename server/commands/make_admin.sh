#!/usr/bin/env bash

set -Eeuo pipefail

USER_ID="${1:-}"

if [[ -z "$USER_ID" ]]; then
  echo "Использование: $0 <user_id>"
  exit 1
fi

if ! [[ "$USER_ID" =~ ^[1-9][0-9]*$ ]]; then
  echo "Ошибка: user_id должен быть положительным целым числом"
  exit 1
fi

RESULT="$(
  docker compose exec -T postgres \
    psql \
    -v ON_ERROR_STOP=1 \
    -v user_id="$USER_ID" \
    -U pantera_user \
    -d pantera \
    -At \
    -F ' | ' <<'SQL'
WITH admin_role AS (
    SELECT id
    FROM roles
    WHERE name = 'admin'
),
updated_user AS (
    UPDATE users AS u
    SET
        role_id = admin_role.id,
        updated_at = NOW()
    FROM admin_role
    WHERE u.id = :'user_id'::integer
    RETURNING
        u.id,
        u.full_name,
        u.number,
        u.role_id
)
SELECT
    updated_user.id,
    updated_user.full_name,
    updated_user.number,
    roles.name
FROM updated_user
JOIN roles ON roles.id = updated_user.role_id;
SQL
)"

if [[ -z "$RESULT" ]]; then
  echo "Ошибка: пользователь id=$USER_ID или роль admin не найдены"
  exit 1
fi

echo "Пользователь назначен администратором:"
echo "id | full_name | number | role"
echo "$RESULT"
