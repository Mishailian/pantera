import { useMemo, useState } from "react";

import {
  useGetUsersQuery,
  useUpdateRequestItemMutation,
  useUpdateRequestMutation,
} from "../app/api/apiSlice";

import { ExpandableText } from "./ExpandableText";
import { InfoCard } from "./InfoCard";

import { docxCreator } from "../../docx/docx_creator";

import {
  ITEM_STATUS_META,
  STATUS_META,
} from "../static/static";


const AVAILABLE_SIGNERS = [
  "Начальник МЭС - Суслов В. А.",
  "Начальник МЦ - Гуда Т. А.",
  "Главный бухгалтер - Чеченева А. А.",
  "Начальник HR - Новосёлова Е. О.",
  "Начальник ОИТ - Голубцов Е. С.",
  "Главный механик - Ложкин И. М.",
  "Главный энергетик - Славных М. А.",
  "Зам. начальника ЦПВС - Гуменный А. В.",
  "Начальник цеха ЦПВС - Санников С. В.",
  "Мастер насосной и теплосетей ЦПВС - Маркевич Е. В.",
  "Начальник производства ШП - Соколова Л. К.",
  "Энергетик - Балашов Ю. А.",
  "Инженер-электроник - Суханов А. П.",
  "Зам. Главного энергетика - Пермяков Н. Ф.",
  "Начальник РСГ - Жованик А. Ю.",
  "Начальник службы безопасности - Пузырёв В. А.",
  "Заместитель начальника службы безопасности - Ильиных М. Н.",
  "Главный метролог - Корелина Е. В.",
  "Начальник заводской лаборатории - Пономарева Н. Ю.",
  "Заместитель главного механика - Поспелов С. А.",
  "Начальник инструментального участка - Аленбаторов П. И.",
];


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


export const SinglePostBlock = ({
  data,
  onApprove,
  onArchive,
}) => {
  const [
    updateRequestItem,
    { isLoading: isUpdating },
  ] = useUpdateRequestItemMutation();

  const [
    updateRequest,
  ] = useUpdateRequestMutation();

  const {
    id,
    postId,
    status,
    department = "supply",
    comment,
    is_edited,

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

    canManage = false,
    canEditRequest = false,

    isAdmin = false,
    isSupplyManager = false,
    isSupplyHead = false,
  } = data || {};

  const canAssign =
    isAdmin ||
    isSupplyManager ||
    isSupplyHead;

  const {
    data: users = [],
  } = useGetUsersQuery(
    undefined,
    {
      skip: !canAssign,
    }
  );

  const supplyUsers = useMemo(() => {
    return users.filter((user) => {
      const roleName =
        user?.role?.name ||
        user?.roles?.[0]?.name;

      return (
        roleName === "supply_manager" ||
        roleName === "supply_head"
      );
    });
  }, [users]);

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    isSavingEdits,
    setIsSavingEdits,
  ] = useState(false);

  const [
    editComment,
    setEditComment,
  ] = useState("");

  const [
    editItems,
    setEditItems,
  ] = useState([]);

  const [
    showDocxModal,
    setShowDocxModal,
  ] = useState(false);

  const [
    docxSigners,
    setDocxSigners,
  ] = useState([]);

  const [
    showArchiveConfirm,
    setShowArchiveConfirm,
  ] = useState(false);

  const [
    isArchiving,
    setIsArchiving,
  ] = useState(false);


  const toggleDocxSigner = (signer) => {
    setDocxSigners((previous) => {
      if (previous.includes(signer)) {
        return previous.filter(
          (currentSigner) =>
            currentSigner !== signer
        );
      }

      return [
        ...previous,
        signer,
      ];
    });
  };


  const handleCreateDocx = () => {
    docxCreator(
      data,
      docxSigners
    );

    setShowDocxModal(false);
    setDocxSigners([]);
  };


  const handleConfirmArchive = async () => {
    if (!onArchive) {
      return;
    }

    setIsArchiving(true);

    try {
      await onArchive();
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  };


  const startEditing = () => {
    setEditComment(
      comment || ""
    );

    setEditItems(
      [...(items || [])]
        .sort(
          (firstItem, secondItem) =>
            firstItem.id - secondItem.id
        )
        .map((item) => ({
          id: item.id,
          name: item.name || "",
          unit: item.unit || "",
          quantity: item.quantity ?? 0,
          deadline: item.deadline || "",
          description: item.description || "",
        }))
    );

    setIsEditing(true);
  };


  const cancelEditing = () => {
    setIsEditing(false);
  };


  const updateEditItem = (
    itemId,
    field,
    value
  ) => {
    setEditItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
            ...item,
            [field]: value,
          }
          : item
      )
    );
  };


  const handleSaveEdits = async () => {
    const hasInvalidItems =
      editItems.some((item) => {
        const hasName =
          String(item.name).trim() !== "";

        const hasUnit =
          String(item.unit).trim() !== "";

        const hasQuantity =
          Number(item.quantity) > 0;

        return (
          !hasName ||
          !hasUnit ||
          !hasQuantity
        );
      });

    if (hasInvalidItems) {
      alert(
        "У каждого пункта должно быть заполнено наименование, единица измерения и количество больше нуля."
      );

      return;
    }

    setIsSavingEdits(true);

    try {
      await updateRequest({
        requestId: postId ?? id,
        comment: editComment,
      }).unwrap();

      await Promise.all(
        editItems.map((item) =>
          updateRequestItem({
            itemId: item.id,

            name:
              String(item.name).trim(),

            unit:
              String(item.unit).trim(),

            quantity:
              Number(item.quantity),

            description:
              item.description
                ? String(item.description).trim()
                : "",

            deadline:
              item.deadline || null,
          }).unwrap()
        )
      );

      setIsEditing(false);
    } catch (error) {
      console.error(
        "Failed to save request edits:",
        error
      );

      alert(
        error?.data?.error ||
        "Не удалось сохранить изменения."
      );
    } finally {
      setIsSavingEdits(false);
    }
  };


  const statusKey =
    STATUS_META[status]
      ? status
      : "undeclared";

  const statusMeta =
    STATUS_META[statusKey];

  const archiveAssigned =
    assigned_to_at_archive_user ||
    assigned_to_user;


  const handleItemStatusChange = async (
    itemId,
    newStatus
  ) => {
    try {
      await updateRequestItem({
        itemId,
        work_status: newStatus,
        is_done: newStatus === "done",
      }).unwrap();
    } catch (error) {
      console.error(
        "Failed to update item status:",
        error
      );

      alert(
        "Не удалось обновить статус позиции."
      );
    }
  };


  const handleItemAssignChange = async (
    itemId,
    userId
  ) => {
    try {
      await updateRequestItem({
        itemId,

        assigned_to_id:
          userId
            ? Number(userId)
            : null,
      }).unwrap();
    } catch (error) {
      console.error(
        "Failed to assign item:",
        error
      );

      alert(
        "Не удалось назначить исполнителя."
      );
    }
  };


  return (
    <div className=" min-w-full">
      <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-8 sm:py-7">



        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {canEditRequest ? (
              isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSavingEdits}
                    className="
              inline-flex h-11 items-center justify-center
              rounded-xl border border-slate-200 bg-white
              px-5 text-sm font-semibold text-slate-700
              shadow-sm transition
              hover:border-slate-300 hover:bg-slate-50
              active:scale-[0.98]
              disabled:cursor-not-allowed disabled:opacity-60
            "
                  >
                    Отмена
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={isSavingEdits}
                    className="
              inline-flex h-11 min-w-[180px] items-center justify-center
              rounded-xl bg-indigo-600 px-5
              text-sm font-semibold text-white
              shadow-md shadow-indigo-600/20
              transition
              hover:bg-indigo-700 hover:shadow-indigo-600/30
              active:scale-[0.98]
              disabled:cursor-not-allowed disabled:opacity-60
            "
                  >
                    {isSavingEdits
                      ? "Сохранение..."
                      : "Сохранить изменения"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="
            inline-flex h-11 items-center justify-center gap-2
            rounded-xl bg-slate-900 px-6
            text-sm font-bold text-white
            shadow-md shadow-slate-900/15
            transition
            hover:bg-slate-800
            active:scale-[0.98]
          "
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>

                  Редактировать
                </button>
              )
            ) : (
              <span className="text-sm text-slate-400">
                Редактирование недоступно
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDocxModal(true)}
            title="Сформировать документ"
            aria-label={`Сформировать документ по заявке ${id}`}
            className="
      group inline-flex h-11 items-center justify-center gap-2
      rounded-xl border border-slate-200 bg-white
      px-4 text-sm font-semibold text-slate-600
      shadow-sm transition-all duration-200
      hover:-translate-y-0.5
      hover:border-indigo-200
      hover:bg-indigo-50
      hover:text-indigo-700
      hover:shadow-md
      active:translate-y-0
      active:scale-[0.98]
    "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8" />
              <path d="M8 17h8" />
            </svg>

            <span className="hidden sm:inline">
              Сформировать документ
            </span>
          </button>
        </div>


        <div className="relative flex flex-col gap-5 pt-14 lg:flex-row lg:items-start lg:justify-between">

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Заявка #{id}
              </div>

              <div
                className={`
                  inline-flex items-center rounded-full
                  px-4 py-2 text-xs font-semibold
                  uppercase tracking-wide ring-1
                  ${statusMeta.badge}
                `}
              >
                {statusMeta.label}
              </div>

              {department === "rezo" && (
                <div className="inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200">
                  Отдел Резо
                </div>
              )}

              {is_edited ? (
                <div className="inline-flex items-center rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
                  Отредактирована
                </div>
              ) : null}

              {mode === "archived" ? (
                <div className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                  Архив
                </div>
              ) : null}
            </div>

            {canManage ? (
              <>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {created_by_user?.full_name ||
                    "Неизвестно"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {created_by_user?.number ||
                    "—"}

                  {created_by_user?.role_label
                    ? ` • ${created_by_user.role_label}`
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

            {canManage ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Обновлено
                </p>

                <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">
                  {updated_at_formatted ||
                    "—"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Дата создания
                </p>

                <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">
                  {created_at_formatted ||
                    "—"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


      {showArchiveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!isArchiving) {
              setShowArchiveConfirm(false);
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="px-6 py-6">
              <h3 className="text-lg font-bold text-slate-900">
                Архивировать заявку?
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Заявка #{id} будет перемещена в
                архив. Это действие необратимо.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowArchiveConfirm(false)
                }
                disabled={isArchiving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isArchiving
                  ? "Архивирование..."
                  : "Да, архивировать"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showDocxModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() =>
            setShowDocxModal(false)
          }
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">
                Создать файл — Заявка #{id}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Выберите подписантов для
                документа
              </p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
              <div className="flex flex-col gap-2">
                {AVAILABLE_SIGNERS.map(
                  (signer) => (
                    <label
                      key={signer}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={docxSigners.includes(
                          signer
                        )}
                        onChange={() =>
                          toggleDocxSigner(
                            signer
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />

                      <span className="text-sm text-slate-700">
                        {signer}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-sm text-slate-500">
                Выбрано:{" "}
                {docxSigners.length}
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocxModal(false);
                    setDocxSigners([]);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Назад
                </button>

                <button
                  type="button"
                  onClick={handleCreateDocx}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Создать файл
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="px-5 py-5 sm:px-8 sm:py-8">
        {canManage ? (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Создатель"
                value={
                  created_by_user?.full_name ||
                  "Неизвестный"
                }
                sub={
                  created_by_user
                    ? `${created_by_user.number ||
                    "—"
                    }${created_by_user.role_label
                      ? ` • ${created_by_user.role_label}`
                      : ""
                    }`
                    : ""
                }
              />

              <InfoCard
                label="Дата создания"
                value={
                  created_at_formatted ||
                  "—"
                }
              />

              <InfoCard
                label="Кто одобрил"
                value={
                  approved_by_user?.full_name ||
                  "—"
                }
                sub={
                  approved_by_user
                    ? `${approved_at_formatted ||
                    "—"
                    } • ${approved_by_user.number ||
                    "—"
                    }`
                    : approved_at_formatted ||
                    null
                }
              />

              <InfoCard
                label={
                  mode === "archived"
                    ? "Архивирована"
                    : "Статус"
                }
                value={
                  mode === "archived"
                    ? archived_at_formatted ||
                    closed_at_formatted ||
                    "—"
                    : statusMeta.label
                }
                sub={
                  mode === "archived" &&
                    archived_by_user
                    ? `${archived_by_user.number ||
                    "—"
                    } • ${archived_by_user.full_name ||
                    "—"
                    }`
                    : null
                }
              />
            </div>

            {mode === "archived" ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard
                  label="Кто был закреплён"
                  value={
                    archiveAssigned?.full_name ||
                    "Не был назначен"
                  }
                  sub={
                    archiveAssigned
                      ? `${archiveAssigned.number ||
                      "—"
                      }${archiveAssigned?.role_label
                        ? ` • ${archiveAssigned.role_label}`
                        : ""
                      }`
                      : "На момент архивирования ответственный не был назначен"
                  }
                />

                <InfoCard
                  label="Кто архивировал"
                  value={
                    archived_by_user?.full_name ||
                    "—"
                  }
                  sub={
                    archived_by_user
                      ? `${archived_by_user.number ||
                      "—"
                      } • ${archived_at_formatted ||
                      "—"
                      }`
                      : archived_at_formatted ||
                      null
                  }
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoCard
              label="№ заявки"
              value={
                id
                  ? `#${id}`
                  : "—"
              }
            />

            <InfoCard
              label="Дата создания"
              value={
                created_at_formatted ||
                "—"
              }
            />

            <InfoCard
              label="Статус"
              value={statusMeta.label}
            />
          </div>
        )}


        {isEditing && canEditRequest ? (
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">
              Цель покупки
            </p>

            <textarea
              value={editComment}
              onChange={(event) =>
                setEditComment(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Опишите цель покупки"
              className="mt-3 w-full resize-none rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        ) : comment && comment.trim() ? (
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



        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {canManage &&
            mode === "active" &&
            onArchive ? (
            <button
              type="button"
              onClick={() =>
                setShowArchiveConfirm(true)
              }
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-200"
            >
              Архивировать
            </button>
          ) : null}

          {canManage &&
            mode === "undeclared" &&
            onApprove ? (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              Подписать заявку
            </button>
          ) : null}
        </div>


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
              {[...items]
                .sort(
                  (firstItem, secondItem) =>
                    firstItem.id -
                    secondItem.id
                )
                .map((item, index) => {
                  const currentStatus =
                    item.work_status ||
                    item.status ||
                    (item.is_done
                      ? "done"
                      : "in_progress");

                  const itemMeta =
                    ITEM_STATUS_META[
                    currentStatus
                    ] ||
                    ITEM_STATUS_META.in_progress;

                  const plannedDate =
                    getPlannedDate(item);

                  const editItem =
                    isEditing &&
                      canEditRequest
                      ? editItems.find(
                        (currentItem) =>
                          currentItem.id ===
                          item.id
                      )
                      : null;

                  return (
                    <div
                      key={item.id || index}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      {editItem ? (
                        <>
                          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Позиция{" "}
                            {index + 1}
                          </div>

                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.2fr_1.1fr_0.8fr_1.1fr_1.8fr] lg:items-start">
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Наименование
                              </span>

                              <textarea
                                value={
                                  editItem.name
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEditItem(
                                    item.id,
                                    "name",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Наименование"
                                rows={2}
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Ед. изм.
                              </span>

                              <input
                                type="text"
                                value={
                                  editItem.unit
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEditItem(
                                    item.id,
                                    "unit",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Количество
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  editItem.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEditItem(
                                    item.id,
                                    "quantity",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Планируемый
                                срок
                              </span>

                              <input
                                type="date"
                                value={
                                  editItem.deadline ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEditItem(
                                    item.id,
                                    "deadline",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Комментарий
                              </span>

                              <textarea
                                value={
                                  editItem.description
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEditItem(
                                    item.id,
                                    "description",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Дополнительная информация"
                                rows={2}
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span
                              className={`
                                inline-flex items-center
                                rounded-full px-3 py-1
                                text-xs font-semibold
                                ${itemMeta.badge}
                              `}
                            >
                              {itemMeta.label}
                            </span>

                            {(item
                              .assigned_to_user
                              ?.full_name ||
                              item
                                .assigned_to_user
                                ?.number) && (
                                <span className="text-xs text-slate-500">
                                  Исполнитель:{" "}
                                  {item
                                    .assigned_to_user
                                    .full_name ||
                                    item
                                      .assigned_to_user
                                      .number}
                                </span>
                              )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] xl:items-start">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Наименование
                              </p>

                              <p
                                className="mt-2 whitespace-pre-wrap break-words font-semibold text-slate-900"
                              >
                                {item.name}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Ед. изм.
                              </p>

                              <p className="mt-2 break-words whitespace-normal text-sm font-semibold text-slate-800">
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
                                Планируемый
                                срок
                              </p>

                              <p className="mt-2 text-sm font-semibold text-slate-800">
                                {plannedDate}
                              </p>
                            </div>

                            <div className="flex min-w-0 flex-col justify-start">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Статус пункта
                              </p>

                              <div className="mt-2">
                                {canManage &&
                                  (mode ===
                                    "active" ||
                                    mode ===
                                    "undeclared") ? (
                                  <select
                                    disabled={
                                      isUpdating
                                    }
                                    value={
                                      currentStatus
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleItemStatusChange(
                                        item.id,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    className={`
                                      h-8 w-full min-w-[130px]
                                      rounded-lg border px-2.5
                                      text-xs font-semibold
                                      outline-none transition
                                      disabled:opacity-50
                                      ${itemMeta.selectBadge}
                                    `}
                                  >{Object.keys(ITEM_STATUS_META).forEach(key => <option value={`${key}`}>{ITEM_STATUS_META[key]}</option>)}</select>
                                ) : (
                                  <span
                                    className={`
                                      inline-flex items-center
                                      rounded-full px-3 py-1
                                      text-xs font-semibold
                                      ${itemMeta.badge}
                                    `}
                                  >
                                    {
                                      itemMeta.label
                                    }
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex min-w-0 flex-col justify-start">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Исполнитель
                              </p>

                              <div className="mt-2">
                                {canManage &&
                                  canAssign &&
                                  (mode ===
                                    "active" ||
                                    mode ===
                                    "undeclared") ? (
                                  <select
                                    disabled={
                                      isUpdating
                                    }
                                    value={
                                      item.assigned_to_id
                                        ? String(
                                          item.assigned_to_id
                                        )
                                        : ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleItemAssignChange(
                                        item.id,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    className="h-8 w-full min-w-[130px] rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500 disabled:opacity-50"
                                  >
                                    <option value="">
                                      Не назначен
                                    </option>

                                    {supplyUsers.map(
                                      (
                                        user
                                      ) => (
                                        <option
                                          key={
                                            user.id
                                          }
                                          value={
                                            user.id
                                          }
                                        >
                                          {user.full_name ||
                                            user.number ||
                                            "—"}
                                        </option>
                                      )
                                    )}
                                  </select>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-800">
                                    {item
                                      .assigned_to_user
                                      ?.full_name ||
                                      item
                                        .assigned_to_user
                                        ?.number ||
                                      "—"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {item.description &&
                            item.description.trim() ? (
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Комментарий
                              </p>

                              <p
                                className="mt-2 w-full whitespace-pre-wrap break-words text-slate-700"
                                style={{
                                  fontSize:
                                    "12pt",
                                  lineHeight:
                                    "1.4",
                                }}
                              >
                                {
                                  item.description
                                }
                              </p>
                            </div>
                          ) : null}
                        </>
                      )}
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
  );
};
