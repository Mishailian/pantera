import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Eye,
  EyeOff,
  Pencil,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  confirmAction,
} from "../../utils/confirmAction";


const HEAD_ROLE_NAMES = new Set([
  "supply_head",
  "it_head",
]);

const HEAD_ROLE_BY_MAIN_ROLE = {
  supply_manager: "supply_head",
  it_department: "it_head",
};


const getRoleName = (role) => {
  if (typeof role === "string") {
    return role;
  }

  return role?.name || "";
};


export const UserRow = ({
  user,
  isAdmin,
  canManageUsers,
  canChangeRoles,
  onRoleChange,
  onUpdateUser,
  onDeleteUser,
  onAssignHead,
  onRemoveHead,
  availableRoles = [],
}) => {
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const allRoleNames = useMemo(
    () =>
      userRoles
        .map(getRoleName)
        .filter(Boolean),
    [userRoles]
  );

  const mainRole = useMemo(
    () =>
      userRoles.find(
        (role) =>
          !HEAD_ROLE_NAMES.has(
            getRoleName(role)
          )
      ) || null,
    [userRoles]
  );

  const mainRoleName =
    getRoleName(mainRole);

  const currentHeadRole =
    allRoleNames.find((roleName) =>
      HEAD_ROLE_NAMES.has(roleName)
    ) || "";

  const targetHeadRole =
    HEAD_ROLE_BY_MAIN_ROLE[
    mainRoleName
    ] || "";

  const hasHeadSubRole =
    Boolean(currentHeadRole);

  const canBecomeHead =
    Boolean(targetHeadRole);

  const editableRoles =
    useMemo(
      () =>
        availableRoles.filter(
          (role) =>
            role?.value &&
            !HEAD_ROLE_NAMES.has(
              role.value
            )
        ),
      [availableRoles]
    );

  const mainRoleLabel =
    editableRoles.find(
      (role) =>
        role.value ===
        mainRoleName
    )?.label ||
    mainRole?.description ||
    mainRoleName ||
    "Роль не назначена";

  const [editing, setEditing] =
    useState(false);

  const [
    selectedRole,
    setSelectedRole,
  ] = useState(mainRoleName);

  const [
    editFullName,
    setEditFullName,
  ] = useState(
    user?.full_name || ""
  );

  const [
    editNumber,
    setEditNumber,
  ] = useState(
    user?.number || ""
  );

  const [
    editPassword,
    setEditPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    togglingHead,
    setTogglingHead,
  ] = useState(false);

  useEffect(() => {
    setSelectedRole(
      mainRoleName
    );

    setEditFullName(
      user?.full_name || ""
    );

    setEditNumber(
      user?.number || ""
    );

    setEditPassword("");
  }, [
    mainRoleName,
    user?.full_name,
    user?.number,
  ]);

  const handleCancel = () => {
    setSelectedRole(
      mainRoleName
    );

    setEditFullName(
      user?.full_name || ""
    );

    setEditNumber(
      user?.number || ""
    );

    setEditPassword("");
    setShowPassword(false);
    setEditing(false);
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const fullName =
      editFullName.trim();

    const number =
      editNumber.trim();

    const password =
      editPassword.trim();

    if (!fullName) {
      alert(
        "Полное имя не может быть пустым."
      );

      return;
    }

    if (!number) {
      alert(
        "Номер телефона или логин не может быть пустым."
      );

      return;
    }

    try {
      setSaving(true);

      if (
        canChangeRoles &&
        selectedRole &&
        selectedRole !==
        mainRoleName
      ) {
        await onRoleChange(
          user.id,
          selectedRole
        );
      }

      const nameChanged =
        fullName !==
        String(
          user?.full_name || ""
        ).trim();

      const numberChanged =
        number !==
        String(
          user?.number || ""
        ).trim();

      const passwordChanged =
        password.length > 0;

      if (
        (
          nameChanged ||
          numberChanged ||
          passwordChanged
        ) &&
        typeof onUpdateUser ===
        "function"
      ) {
        await onUpdateUser(
          user.id,
          {
            full_name:
              fullName,

            number,

            ...(passwordChanged
              ? { password }
              : {}),
          }
        );
      }

      setEditing(false);
      setEditPassword("");
      setShowPassword(false);
    } catch (error) {
      console.error(
        "Не удалось сохранить пользователя:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      deleting ||
      typeof onDeleteUser !==
      "function"
    ) {
      return;
    }

    const confirmed =
      confirmAction({
        message:
          `Удалить аккаунт «${user?.full_name || user?.number || user?.id}»? Это действие необратимо.`,
      });

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await onDeleteUser(
        user.id
      );
    } catch (error) {
      console.error(
        "Не удалось удалить пользователя:",
        error
      );
    } finally {
      setDeleting(false);
    }
  };


  const handleToggleHead = async () => {
    if (
      togglingHead ||
      !isAdmin
    ) {
      return;
    }

    const confirmed = confirmAction({
      message: hasHeadSubRole
        ? "Вы уверены, что хотите снять пользователя с должности начальника?"
        : "Вы уверены, что хотите назначить пользователя начальником?",
    });

    if (!confirmed) {
      return;
    }

    try {
      setTogglingHead(true);

      if (hasHeadSubRole) {
        await onRemoveHead(user.id);
      } else {
        await onAssignHead(user.id);
      }
    } catch (error) {
      console.error(
        "Не удалось изменить должность начальника:",
        error
      );
    } finally {
      setTogglingHead(false);
    }
  };


  return (
    <article
      className="
        min-w-0 overflow-hidden
        rounded-2xl border
        border-slate-200 bg-white
        shadow-sm transition
        hover:border-slate-300
        hover:shadow-md
      "
    >
      <div
        className="
          flex min-w-0 flex-col
          gap-5 p-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div
          className="
            flex min-w-0 flex-1
            items-start gap-4
          "
        >
          <div
            className="
              flex h-12 w-12
              shrink-0 items-center
              justify-center rounded-xl
              bg-slate-100
              text-slate-500
            "
          >
            <UserRound className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <div
                className="
                  grid min-w-0
                  grid-cols-1 gap-3
                  xl:grid-cols-2
                "
              >
                <label className="block min-w-0">
                  <span
                    className="
                      mb-1.5 block
                      text-xs font-bold
                      text-slate-500
                    "
                  >
                    Полное имя
                  </span>

                  <input
                    type="text"
                    value={editFullName}
                    onChange={(event) =>
                      setEditFullName(
                        event.target.value
                      )
                    }
                    placeholder="Полное имя"
                    className="
                      h-11 w-full
                      rounded-xl border
                      border-slate-200
                      bg-white px-4
                      text-sm font-semibold
                      text-slate-900
                      outline-none transition
                      focus:border-blue-400
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                </label>

                <label className="block min-w-0">
                  <span
                    className="
                      mb-1.5 block
                      text-xs font-bold
                      text-slate-500
                    "
                  >
                    Телефон или логин
                  </span>

                  <input
                    type="text"
                    value={editNumber}
                    onChange={(event) =>
                      setEditNumber(
                        event.target.value
                      )
                    }
                    placeholder="Телефон или логин"
                    className="
                      h-11 w-full
                      rounded-xl border
                      border-slate-200
                      bg-white px-4
                      text-sm font-semibold
                      text-slate-900
                      outline-none transition
                      focus:border-blue-400
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                </label>

                <label className="block min-w-0">
                  <span
                    className="
                      mb-1.5 block
                      text-xs font-bold
                      text-slate-500
                    "
                  >
                    Основная роль
                  </span>

                  {canChangeRoles ? (
                    <select
                      value={selectedRole}
                      onChange={(event) =>
                        setSelectedRole(
                          event.target.value
                        )
                      }
                      className="
                        h-11 w-full
                        rounded-xl border
                        border-slate-200
                        bg-white px-4
                        text-sm font-semibold
                        text-slate-900
                        outline-none transition
                        focus:border-blue-400
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    >
                      {editableRoles.map(
                        (role) => (
                          <option
                            key={role.value}
                            value={role.value}
                          >
                            {role.label}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <div
                      className="
                        flex h-11 items-center
                        rounded-xl border
                        border-slate-200
                        bg-slate-50 px-4
                        text-sm font-semibold
                        text-slate-700
                      "
                    >
                      {mainRoleLabel}
                    </div>
                  )}
                </label>

                <label className="block min-w-0">
                  <span
                    className="
                      mb-1.5 block
                      text-xs font-bold
                      text-slate-500
                    "
                  >
                    Новый пароль
                  </span>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={editPassword}
                      onChange={(event) =>
                        setEditPassword(
                          event.target.value
                        )
                      }
                      placeholder="Оставьте пустым, чтобы не менять"
                      className="
                        h-11 w-full
                        rounded-xl border
                        border-slate-200
                        bg-white px-4 pr-11
                        text-sm font-semibold
                        text-slate-900
                        outline-none transition
                        focus:border-blue-400
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                      className="
                        absolute right-3
                        top-1/2 flex
                        h-8 w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400
                        transition
                        hover:bg-slate-100
                        hover:text-slate-700
                      "
                      aria-label={
                        showPassword
                          ? "Скрыть пароль"
                          : "Показать пароль"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <>
                <div
                  className="
                    flex min-w-0
                    flex-wrap items-center
                    gap-2
                  "
                >
                  <h3
                    className="
                      min-w-0 truncate
                      text-base font-black
                      text-slate-950
                    "
                  >
                    {user?.full_name ||
                      "Без имени"}
                  </h3>

                  {hasHeadSubRole ? (
                    <span
                      className="
                        inline-flex items-center
                        gap-1.5 rounded-full
                        border border-amber-200
                        bg-amber-50 px-2.5 py-1
                        text-xs font-bold
                        text-amber-700
                      "
                    >
                      <Crown className="h-3.5 w-3.5" />
                      Начальник
                    </span>
                  ) : null}

                  {!user?.is_active ? (
                    <span
                      className="
                        rounded-full
                        border border-rose-200
                        bg-rose-50 px-2.5 py-1
                        text-xs font-bold
                        text-rose-600
                      "
                    >
                      Неактивен
                    </span>
                  ) : null}
                </div>

                <div
                  className="
                    mt-1 text-sm
                    font-medium
                    text-slate-500
                  "
                >
                  {user?.number ||
                    "Телефон не указан"}
                </div>

                <div
                  className="
                    mt-3 flex flex-wrap
                    items-center gap-2
                  "
                >
                  <span
                    className="
                      inline-flex rounded-full
                      border border-blue-200
                      bg-blue-50 px-3 py-1
                      text-xs font-bold
                      text-blue-700
                    "
                  >
                    {mainRoleLabel}
                  </span>

                  {currentHeadRole ? (
                    <span
                      className="
                        inline-flex rounded-full
                        border border-amber-200
                        bg-amber-50 px-3 py-1
                        text-xs font-bold
                        text-amber-700
                      "
                    >
                      {currentHeadRole}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {canManageUsers ? (
          <div
            className="
              flex shrink-0
              flex-wrap items-center
              justify-end gap-2
            "
          >
            {!editing ? (
              <>
                {isAdmin &&
                  (
                    canBecomeHead ||
                    hasHeadSubRole
                  ) ? (
                  <button
                    type="button"
                    onClick={
                      handleToggleHead
                    }
                    disabled={
                      togglingHead
                    }
                    className={`
                      inline-flex h-10
                      items-center
                      justify-center gap-2
                      rounded-xl border
                      px-4 text-sm
                      font-bold transition
                      disabled:cursor-wait
                      disabled:opacity-50
                      ${hasHeadSubRole
                        ? `
                            border-amber-200
                            bg-amber-50
                            text-amber-700
                            hover:bg-amber-100
                          `
                        : `
                            border-emerald-200
                            bg-emerald-50
                            text-emerald-700
                            hover:bg-emerald-100
                          `
                      }
                    `}
                  >
                    <Crown className="h-4 w-4" />

                    {togglingHead
                      ? "Сохранение..."
                      : hasHeadSubRole
                        ? "Снять с должности"
                        : "Назначить начальником"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setEditing(true)
                  }
                  className="
                    inline-flex h-10
                    items-center
                    justify-center gap-2
                    rounded-xl
                    bg-slate-900 px-4
                    text-sm font-bold
                    text-white transition
                    hover:bg-slate-700
                  "
                >
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="
                    inline-flex h-10
                    items-center
                    justify-center gap-2
                    rounded-xl border
                    border-rose-200
                    bg-rose-50 px-4
                    text-sm font-bold
                    text-rose-600
                    transition
                    hover:bg-rose-100
                    disabled:cursor-wait
                    disabled:opacity-50
                  "
                >
                  <Trash2 className="h-4 w-4" />

                  {deleting
                    ? "Удаление..."
                    : "Удалить"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="
                    inline-flex h-10
                    items-center
                    justify-center gap-2
                    rounded-xl border
                    border-slate-200
                    bg-white px-4
                    text-sm font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  <X className="h-4 w-4" />
                  Отмена
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="
                    inline-flex h-10
                    items-center
                    justify-center gap-2
                    rounded-xl
                    bg-blue-600 px-4
                    text-sm font-bold
                    text-white transition
                    hover:bg-blue-500
                    disabled:cursor-wait
                    disabled:opacity-50
                  "
                >
                  <Save className="h-4 w-4" />

                  {saving
                    ? "Сохранение..."
                    : "Сохранить"}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
};
