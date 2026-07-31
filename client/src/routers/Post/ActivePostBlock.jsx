import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Archive,
  Check,
  Eye,
  Trash2,
  UserRound,
} from "lucide-react";


const STATUS_CONFIG = {
  undeclared: {
    label: "Без подписи",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    dotClass:
      "bg-amber-500",
  },

  active: {
    label: "В работе",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    dotClass:
      "bg-blue-500",
  },

  archived: {
    label: "Завершена",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass:
      "bg-emerald-500",
  },
};


const getRequestPath = (requestData) => {
  const requestId = requestData?.id;
  const status = requestData?.status;

  if (status === "undeclared") {
    return `/undeclared/${requestId}`;
  }

  if (status === "archived") {
    return `/archived/${requestId}`;
  }

  return `/store/${requestId}`;
};


const getCreator = (requestData) => {
  return (
    requestData?.created_by_user ||
    requestData?.createdBy ||
    requestData?.createdbyuser ||
    null
  );
};


const getUserName = (user) => {
  return (
    user?.full_name ||
    user?.fullName ||
    user?.fullname ||
    "Не указан"
  );
};


const getUserNumber = (user) => {
  return user?.number || "";
};


const getAssignedUsers = (requestData) => {
  const users = [];
  const usedKeys = new Set();

  const appendUser = (user) => {
    if (!user) {
      return;
    }

    const key =
      user.id ??
      user.number ??
      user.full_name ??
      user.fullName;

    if (
      key !== undefined &&
      key !== null &&
      usedKeys.has(key)
    ) {
      return;
    }

    if (
      key !== undefined &&
      key !== null
    ) {
      usedKeys.add(key);
    }

    users.push(user);
  };

  appendUser(
    requestData?.assigned_to_user ||
    requestData?.assignedTo
  );

  for (
    const item
    of requestData?.items || []
  ) {
    appendUser(
      item?.assigned_to_user ||
      item?.assignedTo
    );
  }

  return users;
};


const parseDateTime = (requestData) => {
  if (requestData?.created_at_formatted) {
    const [date = "—", time = ""] =
      requestData.created_at_formatted.split(" ");

    return {
      date,
      time,
    };
  }

  if (!requestData?.created_at) {
    return {
      date: "—",
      time: "",
    };
  }

  const parsedDate = new Date(
    requestData.created_at
  );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return {
      date: "—",
      time: "",
    };
  }

  return {
    date: new Intl.DateTimeFormat(
      "ru-RU",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(parsedDate),

    time: new Intl.DateTimeFormat(
      "ru-RU",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(parsedDate),
  };
};


const ActionIconButton = ({
  title,
  onClick,
  children,
  className = "",
}) => {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`
        inline-flex h-10 w-10 shrink-0
        items-center justify-center
        rounded-xl border
        transition duration-150
        active:scale-95
        ${className}
      `}
    >
      {children}
    </button>
  );
};


export const ActivePostBlock = ({
  data,
  canManage = false,
  canDelete = false,
  onArchive,
  onDelete,
  onSign,
}) => {
  const navigate = useNavigate();

  const requestId = data?.id;

  const requestStatus =
    data?.status || "undeclared";

  const statusConfig =
    STATUS_CONFIG[requestStatus] ||
    STATUS_CONFIG.undeclared;

  const creator = useMemo(
    () => getCreator(data),
    [data]
  );

  const assignedUsers = useMemo(
    () => getAssignedUsers(data),
    [data]
  );

  const { date, time } = useMemo(
    () => parseDateTime(data),
    [
      data?.created_at,
      data?.created_at_formatted,
    ]
  );

  const creatorName =
    getUserName(creator);

  const creatorNumber =
    getUserNumber(creator);

  const itemsCount =
    data?.items_count ??
    data?.items?.length ??
    data?.items_preview?.length ??
    0;

  const primaryAssignedUser =
    assignedUsers[0] || null;

  const canSign =
    canManage &&
    requestStatus === "undeclared" &&
    typeof onSign === "function";

  const canArchive =
    canManage &&
    requestStatus === "active" &&
    typeof onArchive === "function";

  const canRemove =
    canDelete &&
    typeof onDelete === "function";

  const handleOpen = () => {
    navigate(
      getRequestPath(data)
    );
  };


  return (
    <tr
      className="
        group border-b border-slate-100
        bg-white transition
        last:border-b-0
        hover:bg-slate-50/70
      "
    >
      {/* Номер */}
      <td className="whitespace-nowrap px-5 py-4 align-middle">
        <span className="text-sm font-black text-slate-950">
          #{requestId}
        </span>
      </td>

      {/* Дата */}
      <td className="whitespace-nowrap px-5 py-4 align-middle">
        <div className="text-sm font-bold text-slate-800">
          {date}
        </div>

        {time ? (
          <div className="mt-0.5 text-xs font-semibold text-slate-400">
            {time}
          </div>
        ) : null}
      </td>

      {/* Статус */}
      <td className="whitespace-nowrap px-5 py-4 align-middle">
        <span
          className={`
            inline-flex h-8 items-center gap-2
            rounded-full border px-3
            text-xs font-bold
            ${statusConfig.className}
          `}
        >
          <span
            className={`
              h-2 w-2 rounded-full
              ${statusConfig.dotClass}
            `}
          />

          {statusConfig.label}
        </span>
      </td>

      {/* Создатель */}
      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl bg-slate-100
              text-slate-500
            "
          >
            <UserRound className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div
              title={creatorName}
              className="
                truncate text-sm font-bold
                text-slate-900
              "
            >
              {creatorName}
            </div>

            <div
              title={creatorNumber}
              className="
                mt-0.5 truncate text-xs
                font-medium text-slate-400
              "
            >
              {creatorNumber ||
                "Телефон не указан"}
            </div>
          </div>
        </div>
      </td>

      {/* Позиции */}
      <td className="px-5 py-4 text-center align-middle">
        <span
          className="
            inline-flex min-w-9 items-center
            justify-center rounded-lg
            bg-slate-100 px-2.5 py-1.5
            text-sm font-black text-slate-700
          "
        >
          {itemsCount}
        </span>
      </td>

      {/* Ответственный */}
      <td className="px-5 py-4 align-middle">
        {primaryAssignedUser ? (
          <div className="min-w-0">
            <div
              title={getUserName(
                primaryAssignedUser
              )}
              className="
                truncate text-sm font-bold
                text-slate-800
              "
            >
              {getUserName(
                primaryAssignedUser
              )}
            </div>

            <div className="mt-0.5 text-xs font-medium text-slate-400">
              {assignedUsers.length > 1
                ? `Ещё ${assignedUsers.length - 1}`
                : getUserNumber(
                  primaryAssignedUser
                ) || "Назначен"}
            </div>
          </div>
        ) : (
          <span
            className="
              inline-flex rounded-lg
              bg-slate-100 px-2.5 py-1.5
              text-xs font-semibold
              text-slate-400
            "
          >
            Не назначен
          </span>
        )}
      </td>

      {/* Действия */}
      <td className="whitespace-nowrap px-5 py-4 align-middle">
        <div
          className="
            flex flex-nowrap items-center
            justify-end gap-2
            whitespace-nowrap
          "
        >
          <button
            type="button"
            onClick={handleOpen}
            className="
              inline-flex h-10 shrink-0
              items-center justify-center gap-2
              rounded-xl bg-slate-900 px-4
              text-sm font-bold text-white
              shadow-sm transition
              hover:bg-slate-700
              active:scale-[0.98]
            "
          >
            <Eye className="h-4 w-4" />
            Открыть
          </button>

          {canSign ? (
            <ActionIconButton
              title="Подписать заявку"
              onClick={() =>
                onSign(requestId)
              }
              className="
                border-emerald-200
                bg-emerald-50
                text-emerald-700
                hover:border-emerald-300
                hover:bg-emerald-100
              "
            >
              <Check className="h-4 w-4" />
            </ActionIconButton>
          ) : null}

          {canArchive ? (
            <ActionIconButton
              title="Завершить заявку"
              onClick={() =>
                onArchive(requestId)
              }
              className="
                border-blue-200
                bg-blue-50
                text-blue-700
                hover:border-blue-300
                hover:bg-blue-100
              "
            >
              <Archive className="h-4 w-4" />
            </ActionIconButton>
          ) : null}

          {canRemove ? (
            <ActionIconButton
              title="Удалить заявку"
              onClick={() =>
                onDelete(requestId)
              }
              className="
                border-rose-200
                bg-rose-50
                text-rose-600
                hover:border-rose-300
                hover:bg-rose-100
              "
            >
              <Trash2 className="h-4 w-4" />
            </ActionIconButton>
          ) : null}
        </div>
      </td>
    </tr>
  );
};
