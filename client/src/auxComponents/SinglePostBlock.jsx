import React, { useMemo } from "react";
import { useUpdateRequestItemMutation, useGetUsersQuery } from "../app/api/apiSlice";
import { ExpandableText } from "./ExpandableText";

const STATUS_META = {
  archived: {
    label: "Архивная",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  active: {
    label: "Активная",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  undeclared: {
    label: "На рассмотрении",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  pending_director: {
    label: "На согласовании",
    badge: "bg-sky-100 text-sky-800 ring-sky-200",
  },
};

const ITEM_STATUS_META = {
  in_progress: {
    label: "В работе",
    badge: "bg-amber-100 text-amber-800",
    selectBadge:
      "bg-amber-50 text-amber-800 border-amber-200 focus:ring-amber-500/20 focus:border-amber-500",
  },
  on_payment: {
    label: "На оплате",
    badge: "bg-blue-100 text-blue-800",
    selectBadge:
      "bg-blue-50 text-blue-800 border-blue-200 focus:ring-blue-500/20 focus:border-blue-500",
  },
  done: {
    label: "Выполнено",
    badge: "bg-emerald-100 text-emerald-800",
    selectBadge:
      "bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500",
  },
  rejected: {
    label: "Отказ",
    badge: "bg-rose-100 text-rose-800",
    selectBadge:
      "bg-rose-50 text-rose-800 border-rose-200 focus:ring-rose-500/20 focus:border-rose-500",
  },
};

const InfoCard = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-base font-semibold text-slate-900">
      {value || "—"}
    </p>
    {sub ? <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{sub}</p> : null}
  </div>
);

const getPlannedDate = (item) => {
  return (
    item?.deadline_formatted ||
    item?.planned_deadline_formatted ||
    item?.planned_date_formatted ||
    item?.deadline ||
    item?.planned_deadline ||
    item?.planned_date ||
    item?.planned_at ||
    "—"
  );
};

export const SinglePostBlock = ({ data, onApprove, onReject }) => {
  const [updateRequestItem, { isLoading: isUpdating }] =
    useUpdateRequestItemMutation();

  const {
    id,
    status,
    comment,
    created_by_user,
    approved_by_user,
    archived_by_user,
    assigned_to_user,
    assigned_to_at_archive_user,
    department_label,
    created_at_formatted,
    updated_at_formatted,
    approved_at_formatted,
    closed_at_formatted,
    archived_at_formatted,
    items,
    items_count,
    mode = "active",
    canManage = false,
    canSeeFullDetails = canManage,
    isAdmin = false,
    isSupplyManager = false,
  } = data || {};

  const canAssign = isAdmin || isSupplyManager;

  const { data: users = [] } = useGetUsersQuery(undefined, { skip: !canAssign });
  const supplyUsers = useMemo(
    () => users.filter((u) => u?.roles?.some((r) => r?.name === "supply_manager")),
    [users]
  );

  const statusKey = STATUS_META[status] ? status : "undeclared";
  const statusMeta = STATUS_META[statusKey];
  const archiveAssigned = assigned_to_at_archive_user || assigned_to_user;

  const handleItemStatusChange = async (itemId, newStatus) => {
    try {
      await updateRequestItem({
        itemId,
        work_status: newStatus,
        is_done: newStatus === "done",
      }).unwrap();
    } catch (error) {
      console.error("Failed to update item status:", error);
      alert("Не удалось обновить статус позиции.");
    }
  };

  const handleItemAssignChange = async (itemId, userId) => {
    try {
      await updateRequestItem({
        itemId,
        assigned_to_id: userId ? Number(userId) : null,
      }).unwrap();
    } catch (error) {
      console.error("Failed to assign item:", error);
      alert("Не удалось назначить исполнителя.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Заявка #{id}
                </div>

                <div
                  className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ring-1 ${statusMeta.badge}`}
                >
                  {statusMeta.label}
                </div>

                {mode === "archived" ? (
                  <div className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                    Архив
                  </div>
                ) : null}
              </div>

              {canSeeFullDetails ? (
                <>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {created_by_user?.full_name || "Неизвестно"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {created_by_user?.number || "—"}
                    {department_label || created_by_user?.role_label
                      ? ` • ${department_label || created_by_user.role_label}`
                      : ""}
                  </p>
                </>
              ) : (
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Заявка пользователя
                </h2>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[320px]">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Позиции
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {items_count || 0}
                </p>
              </div>

              {canSeeFullDetails ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Обновлено
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">
                    {updated_at_formatted || "—"}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Дата создания
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">
                    {created_at_formatted || "—"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-8">
          {canSeeFullDetails ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                  label="Создатель"
                  value={created_by_user?.full_name || "Неизвестный"}
                  sub={
                    created_by_user
                      ? `${created_by_user.number || "—"}${
                          department_label || created_by_user.role_label
                            ? ` • ${department_label || created_by_user.role_label}`
                            : ""
                        }`
                      : ""
                  }
                />

                <InfoCard
                  label="Дата создания"
                  value={created_at_formatted || "—"}
                />

                <InfoCard
                  label="Кто одобрил"
                  value={approved_by_user?.full_name || "—"}
                  sub={
                    approved_by_user
                      ? `${approved_at_formatted || "—"} • ${approved_by_user.number || "—"}`
                      : approved_at_formatted || null
                  }
                />

                <InfoCard
                  label={mode === "archived" ? "Архивирована" : "Статус"}
                  value={
                    mode === "archived"
                      ? archived_at_formatted || closed_at_formatted || "—"
                      : statusMeta.label
                  }
                  sub={
                    mode === "archived" && archived_by_user
                      ? `${archived_by_user.number || "—"} • ${archived_by_user.full_name || "—"}`
                      : null
                  }
                />
              </div>

              {mode === "archived" ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    label="Кто был закреплён"
                    value={archiveAssigned?.full_name || "Не был назначен"}
                    sub={
                      archiveAssigned
                        ? `${archiveAssigned.number || "—"}${archiveAssigned?.role_label ? ` • ${archiveAssigned.role_label}` : ""}`
                        : "На момент архивирования ответственный не был назначен"
                    }
                  />

                  <InfoCard
                    label="Кто архивировал"
                    value={archived_by_user?.full_name || "—"}
                    sub={
                      archived_by_user
                        ? `${archived_by_user.number || "—"} • ${archived_at_formatted || "—"}`
                        : archived_at_formatted || null
                    }
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InfoCard label="№ заявки" value={id ? `#${id}` : "—"} />
              <InfoCard
                label="Дата создания"
                value={created_at_formatted || "—"}
              />
              <InfoCard label="Статус" value={statusMeta.label} />
            </div>
          )}

          {comment && comment.trim() ? (
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">
                Цель покупки
              </p>

              <ExpandableText
                text={comment}
                limit={30}
                className="mt-3 w-full"
                textClassName="w-full whitespace-pre-wrap break-words text-sm leading-7 text-slate-800"
              />
            </div>
          ) : null}

          {canManage && mode === "undeclared" && onApprove ? (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onApprove}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                Одобрить
              </button>
            </div>
          ) : null}

          {canManage && mode === "approval" ? (
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {onReject ? (
                <button
                  type="button"
                  onClick={onReject}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-rose-50 px-6 font-semibold text-rose-700 ring-1 ring-rose-200 shadow-sm transition hover:bg-rose-100"
                >
                  Отклонить
                </button>
              ) : null}
              {onApprove ? (
                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  Одобрить заявку
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Позиции заявки
              </h3>
              <span className="text-sm text-slate-500">
                {items_count || 0} шт.
              </span>
            </div>

            {items && items.length > 0 ? (
              <div className="space-y-3">
                {[...items].sort((a, b) => a.id - b.id).map((item, index) => {
                  const currentStatus =
                    item.work_status ||
                    item.status ||
                    (item.is_done ? "done" : "in_progress");

                  const itemMeta =
                    ITEM_STATUS_META[currentStatus] || ITEM_STATUS_META.in_progress;

                  const plannedDate = getPlannedDate(item);

                  return (
                    <div
                      key={item.id || index}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] xl:items-start">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Наименование
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900 break-words whitespace-normal">
                            {item.name}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Ед. изм.
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800 break-words whitespace-normal">
                            {item.unit}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Количество
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {item.quantity}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Планируемый срок
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {plannedDate}
                          </p>
                        </div>

                        <div className="flex flex-col justify-start min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Статус пункта
                          </p>

                          <div className="mt-2">
                            {canManage && (mode === "active" || mode === "undeclared") ? (
                              <select
                                disabled={isUpdating}
                                value={currentStatus}
                                onChange={(e) =>
                                  handleItemStatusChange(item.id, e.target.value)
                                }
                                className={`h-8 w-full min-w-[130px] rounded-lg border px-2.5 text-xs font-semibold outline-none transition disabled:opacity-50 ${itemMeta.selectBadge}`}
                              >
                                <option value="in_progress">В работе</option>
                                <option value="on_payment">На оплате</option>
                                <option value="done">Выполнено</option>
                                <option value="rejected">Отказ</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${itemMeta.badge}`}
                              >
                                {itemMeta.label}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Исполнитель
                          </p>
                          <div className="mt-2">
                            {canManage && canAssign && (mode === "active" || mode === "undeclared") ? (
                              <select
                                disabled={isUpdating}
                                value={item.assigned_to_id ? String(item.assigned_to_id) : ""}
                                onChange={(e) => handleItemAssignChange(item.id, e.target.value)}
                                className="h-8 w-full min-w-[130px] rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500 disabled:opacity-50"
                              >
                                <option value="">Не назначен</option>
                                {supplyUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.full_name || u.number || "—"}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm font-semibold text-slate-800">
                                {item.assigned_to_user?.full_name || item.assigned_to_user?.number || "—"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.description && item.description.trim() ? (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Комментарий
                          </p>

                          <ExpandableText
                            text={item.description}
                            limit={20}
                            className="mt-2 w-full"
                            textClassName="w-full whitespace-pre-wrap break-words text-sm leading-6 text-slate-700"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Позиции заявки отсутствуют
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};