import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetUsersQuery, useUpdateRequestMutation } from "../app/api/apiSlice";


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
    return {
      username: "—",
      fullName: "—",
    };
  }

  return {
    username: user.username || "—",
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

  const assignedToId = data?.assigned_to_id ?? data?.assignedtoid ?? null;

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(
    assignedToId ? String(assignedToId) : ""
  );

  const [updateRequest, { isLoading: isSavingAssign }] = useUpdateRequestMutation();
  const { data: users = [] } = useGetUsersQuery(undefined, { skip: !isAdmin });

  const supplyUsers = useMemo(() => {
    return users.filter((user) =>
      user?.roles?.some((role) => role?.name === "supply_manager")
    );
  }, [users]);

  const requestId = data?.id;
  const status = data?.status || "active";
  const statusMeta = STATUS_LABELS[status] || STATUS_LABELS.active;

  const createdAt = data?.created_at || data?.createdat || null;
  const createdDate = formatDateParts(createdAt);

  const itemsCount =
    data?.items_count ??
    data?.itemscount ??
    data?.items?.length ??
    0;

  const author = getUserDisplay(data?.created_by_user || data?.createdbyuser || null);
  const assignedUser = getUserDisplay(data?.assigned_to_user || data?.assignedtouser || null);

  const handleOpen = () => {
    // Безопасно извлекаем названия ролей, независимо от того, массив это объектов или строк
    const roleNames = currentUserRoles.map((role) => 
      typeof role === "string" ? role : role?.name
    ).filter(Boolean);

    // Проверяем, есть ли нужные права
    const hasPrivileges = roleNames.some((roleName) =>
      ["admin", "supply_manager"].includes(roleName)
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

  const handleAssignSave = async () => {
    setAssignError("");

    try {
      await updateRequest({
        requestId,
        assigned_to_id: selectedUserId ? Number(selectedUserId) : null,
      }).unwrap();
      setIsAssigning(false);
    } catch (error) {
      setAssignError(error?.data?.error || "Не удалось сохранить");
    }
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
        </div>

        <div className="w-[180px] min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">
            Создатель
          </div>
          <div className="break-all text-[13px] font-semibold leading-4 text-slate-900">
            {author.username}
          </div>
          <div className="mt-1 whitespace-normal break-words text-[13px] leading-4 text-slate-500">
            {author.fullName}
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
            Назначенный пользователь
          </div>

          {isAdmin && canManage ? (
            !isAssigning ? (
              <div className="min-w-0">
                <div className="flex items-start gap-1">
                  <div
                    className="min-w-0 flex-1 break-all text-[13px] font-semibold leading-4 text-slate-900"
                    title={assignedUser.username}
                  >
                    {assignedUser.username}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAssigning(true)}
                    className="mt-0.5 inline-flex h-8 min-w-[30px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Назначить пользователя"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536M9 11l6.768-6.768a2.5 2.5 0 113.536 3.536L12.536 14.536A4 4 0 019.708 15.7L6 16l.3-3.708A4 4 0 017.464 9.464L14.232 2.696"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className="mt-1 whitespace-normal break-words text-[13px] leading-4 text-slate-500"
                  title={assignedUser.fullName}
                >
                  {assignedUser.fullName}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500"
                >
                  <option value="">Не назначен</option>
                  {supplyUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username || "—"} — {user.full_name || user.fullname || "—"}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAssignSave}
                    disabled={isSavingAssign}
                    className="inline-flex h-7 items-center justify-center rounded-lg bg-slate-900 px-2.5 text-[11px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssigning(false);
                      setAssignError("");
                    }}
                    className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                </div>

                {assignError ? (
                  <div className="text-[11px] text-rose-600">{assignError}</div>
                ) : null}
              </div>
            )
          ) : (
            <>
              <div className="break-all text-[13px] font-semibold leading-4 text-slate-900">
                {assignedUser.username}
              </div>
              <div className="mt-1 whitespace-normal break-words text-[13px] leading-4 text-slate-500">
                {assignedUser.fullName}
              </div>
            </>
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