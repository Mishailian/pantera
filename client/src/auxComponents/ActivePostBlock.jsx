import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";


const STATUS_LABELS = {
  active: {
    label: "Активна",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  undeclared: {
    label: "Без подписи",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  archived: {
    label: "В архиве",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
  },
};

const getUserDisplay = (user) => {
  if (!user) {
    return { phone: "", fullName: "Неизвестный" };
  }
  return {
    phone: user.number || "—",
    fullName: user.full_name || user.fullname || "—",
  };
};

const formatDateParts = (value) => {
  if (!value) {
    return { date: "—", time: "—" };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const raw = String(value);
    const [d, t] = raw.split(" ");
    return {
      date: d || raw,
      time: t || "—",
    };
  }

  const pad = (n) => String(n).padStart(2, "0");

  return {
    date: `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

export const ActivePostBlock = ({ data, canManage, onArchive, onDelete, onSign }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isUndeclaredPage = location.pathname.includes('/undeclared');
  const isArchivedPage = location.pathname.includes('/archived');
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const isAdmin = currentUserRoles.some((role) => role?.name === "admin");

  const itemAssignees = useMemo(() => {
    const items = data?.items || [];
    const seen = new Set();
    const result = [];
    for (const item of items) {
      const user = item?.assigned_to_user;
      if (user) {
        const key = user.id || user.number;
        if (key && !seen.has(key)) {
          seen.add(key);
          result.push({
            fullName: user.full_name || "—",
            phone: user.number || "—",
          });
        }
      }
    }
    return result;
  }, [data?.items]);

  const requestId = data?.id;
  const status = data?.status || "active";
  const department = data?.department || "supply";
  const statusMeta = STATUS_LABELS[status] || STATUS_LABELS.active;

  const createdAt = data?.created_at || data?.createdat || null;
  const createdDate = formatDateParts(createdAt);

  const itemsCount =
    data?.items_count ??
    data?.itemscount ??
    data?.items?.length ??
    0;

  const author = getUserDisplay(data?.created_by_user || data?.createdbyuser || null);

  const handleOpen = () => {
    // Безопасно извлекаем названия ролей, независимо от того, массив это объектов или строк
    const roleNames = currentUserRoles.map((role) => 
      typeof role === "string" ? role : role?.name
    ).filter(Boolean);

    // Проверяем, есть ли нужные права
    const hasPrivileges = roleNames.some((roleName) =>
      ["admin", "supply_manager", "supply_head", "rezo_department", "rezo_head"].includes(roleName)
    );

    // Если прав НЕТ — идём по пути для обычного сотрудника
    if (!hasPrivileges) {
      return navigate(`/my-requests/${requestId}`);
    }

    // Если права ЕСТЬ — идём по админским путям
    if (status === "archived") return navigate(`/archived/${requestId}`);
    if (status === "undeclared") return navigate(`/undeclared/${requestId}`);
    navigate(`/store/${requestId}`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 text-sm xl:grid-cols-[40px_90px_90px_160px_80px_190px_170px] xl:items-center xl:gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            №
          </div>
          <div className="text-base font-semibold text-slate-900">#{requestId}</div>
        </div>

        <div className="w-[110px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Дата создания
          </div>
          <div className="text-[13px] font-medium leading-4 text-slate-700">
            <div>{createdDate.date}</div>
            <div className="mt-1 text-slate-500">{createdDate.time}</div>
          </div>
        </div>

        <div className="w-[110px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Статус
          </div>
          <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${statusMeta.badge}`}>
            {statusMeta.label}
          </span>
          {department === "rezo" && (
            <span className="mt-1 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              Резо
            </span>
          )}
        </div>

        <div className="w-[180px] min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Создатель
          </div>
          <div className="break-all text-[13px] font-semibold leading-4 text-slate-900">
            {author.fullName}
          </div>
          <div className="mt-1 whitespace-normal break-words text-[13px] leading-4 text-slate-500">
            {author.phone}
          </div>
        </div>

        <div className="w-[80px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Позиций
          </div>
          <div className="text-[13px] font-semibold text-slate-700">{itemsCount}</div>
        </div>

        <div className="w-[150px] min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Исполнители
          </div>

          {itemAssignees.length > 0 ? (
            <div className="space-y-1">
              {itemAssignees.map((a, i) => (
                <div key={i}>
                  <div className="break-words text-[13px] font-semibold leading-4 text-slate-900">{a.fullName}</div>
                  <div className="text-[12px] leading-4 text-slate-500">{a.phone}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[13px] text-slate-400">—</div>
          )}
        </div>

        <div className="w-[170px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Действия
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex h-8 items-center justify-center rounded-xl bg-slate-900 px-3 text-[13px] font-semibold text-white transition hover:bg-black"
            >
              Открыть
            </button>

            {/* ЛОГИКА АРХИВА / ПОДПИСИ */}
            {canManage && isUndeclaredPage ? (
              // Если мы на странице "Без подписи" — показываем кнопку "Подписать"
              <button
                type="button"
                onClick={() => onSign?.(requestId)}
                className="inline-flex h-8 items-center justify-center rounded-xl bg-emerald-100 px-3 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-200"
                title="Подписать заявку"
              >
                Подписать
              </button>
            ) : canManage && status !== "archived" && !isUndeclaredPage ? (
              // Если мы на обычных страницах — показываем кнопку "В архив"
              <button
                type="button"
                onClick={() => onArchive?.(requestId)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                title="Архивировать"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            ) : null}

            {/* ЛОГИКА УДАЛЕНИЯ */}
            {canManage && !isArchivedPage ? (
              // Если мы НЕ в архиве — показываем корзину
              <button
                type="button"
                onClick={() => onDelete?.(requestId)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                title="Удалить"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};