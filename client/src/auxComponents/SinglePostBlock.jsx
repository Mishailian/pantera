import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useUpdateRequestItemMutation } from "../app/api/apiSlice";

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
};

const ITEM_STATUS_META = {
  done: {
    label: "Готов",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  in_progress: {
    label: "В работе",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  rejected: {
    label: "Отказ",
    badge: "bg-rose-100 text-rose-800 ring-rose-200",
  },
};

const STATUS_OPTIONS = [
  { value: "done", label: "Готов" },
  { value: "in_progress", label: "В работе" },
  { value: "rejected", label: "Отказ" },
];

const normalizeItemStatus = (item) => {
  const value = item?.work_status || (item?.is_done ? "done" : "in_progress");
  return ITEM_STATUS_META[value] ? value : "in_progress";
};

const InfoCard = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-base font-semibold text-slate-900">{value || "—"}</p>
    {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
  </div>
);

const ItemCard = ({ item, mode, canEdit, onStatusChange, savingId }) => {
  const status = normalizeItemStatus(item);
  const statusMeta = ITEM_STATUS_META[status];
  const locked = mode === "archived" || !canEdit;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-6 xl:items-start">
        <div className="xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Наименование
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">{item.name}</p>
          {item.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ед. изм.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{item.unit}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Количество
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{item.quantity}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Статус
          </p>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusMeta.badge}`}
          >
            {statusMeta.label}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Действие
          </p>
          <select
            value={status}
            disabled={locked || savingId === item.id}
            onChange={(e) => onStatusChange(item.id, e.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export const SinglePostBlock = ({ data }) => {
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const canManage = useMemo(
    () => currentUserRoles.some((role) => ["admin", "supply_manager"].includes(role?.name)),
    [currentUserRoles]
  );

  const [updateRequestItem, { isLoading }] = useUpdateRequestItemMutation();
  const [savingId, setSavingId] = useState(null);

  const {
    id,
    status,
    comment,
    created_by_user,
    approved_by_user,
    archived_by_user,
    assigned_to_user,
    assigned_to_at_archive_user,
    created_at_formatted,
    updated_at_formatted,
    approved_at_formatted,
    closed_at_formatted,
    archived_at_formatted,
    items,
    items_count,
    mode = "active",
  } = data || {};

  const statusKey = STATUS_META[status] ? status : "undeclared";
  const statusMeta = STATUS_META[statusKey];
  const archiveAssigned = assigned_to_at_archive_user || assigned_to_user;

  const handleStatusChange = async (itemId, nextStatus) => {
    try {
      setSavingId(itemId);
      await updateRequestItem({
        itemId,
        work_status: nextStatus,
        is_done: nextStatus === "done",
      }).unwrap();
    } catch (err) {
      console.error("Failed to update item status", err);
      alert("Не удалось обновить статус позиции");
    } finally {
      setSavingId(null);
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
                <div className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ring-1 ${statusMeta.badge}`}>
                  {statusMeta.label}
                </div>
                {mode === "archived" ? (
                  <div className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                    Архив
                  </div>
                ) : null}
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {created_by_user?.full_name || created_by_user?.username || "Неизвестно"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                @{created_by_user?.username || "unknown"}
                {created_by_user?.role_label ? ` • ${created_by_user.role_label}` : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[320px]">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Позиции</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{items_count || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Обновлено</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">{updated_at_formatted || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Создатель"
              value={created_by_user?.full_name || created_by_user?.username}
              sub={
                created_by_user?.username
                  ? `@${created_by_user.username}${created_by_user?.role_label ? ` • ${created_by_user.role_label}` : ""}`
                  : null
              }
            />
            <InfoCard label="Дата создания" value={created_at_formatted || "—"} />
            <InfoCard
              label="Кто одобрил"
              value={approved_by_user?.full_name || "—"}
              sub={
                approved_by_user?.username
                  ? `${approved_at_formatted || "—"} • @${approved_by_user.username}`
                  : approved_at_formatted || null
              }
            />
            <InfoCard
              label={mode === "archived" ? "Архивирована" : "Статус"}
              value={mode === "archived" ? archived_at_formatted || closed_at_formatted || "—" : statusMeta.label}
              sub={
                mode === "archived" && archived_by_user
                  ? `@${archived_by_user.username} • ${archived_by_user.full_name}`
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
                  archiveAssigned?.username
                    ? `@${archiveAssigned.username}${archiveAssigned?.role_label ? ` • ${archiveAssigned.role_label}` : ""}`
                    : "На момент архивирования ответственный не был назначен"
                }
              />
              <InfoCard
                label="Кто архивировал"
                value={archived_by_user?.full_name || "—"}
                sub={
                  archived_by_user?.username
                    ? `@${archived_by_user.username} • ${archived_at_formatted || "—"}`
                    : archived_at_formatted || null
                }
              />
            </div>
          ) : null}

          {comment && comment.trim() ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Комментарий</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{comment}</p>
            </div>
          ) : null}

          <div className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Позиции заявки</h3>
                {isLoading ? <span className="text-sm text-emerald-600">Сохранение...</span> : null}
              </div>
              <span className="text-sm text-slate-500">{items_count || 0} шт.</span>
            </div>

            {items && items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <ItemCard
                    key={item.id || index}
                    item={item}
                    mode={mode}
                    canEdit={mode !== "archived" && canManage}
                    onStatusChange={handleStatusChange}
                    savingId={savingId}
                  />
                ))}
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