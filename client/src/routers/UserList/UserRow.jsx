import { useEffect, useState } from "react";

const HEAD_ROLE_NAMES = new Set(["supply_head", "it_head"]);
const HEAD_ELIGIBLE_ROLES = new Set(["supply_manager", "it_department"]);

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
  const allRoleNames = (user.roles || []).map((r) => r.name);
  const mainRole = user.roles?.find((r) => !HEAD_ROLE_NAMES.has(r.name));
  const mainRoleName = mainRole?.name || "";
  const hasHeadSubRole = allRoleNames.some((n) => HEAD_ROLE_NAMES.has(n));
  const canBecomHead = HEAD_ELIGIBLE_ROLES.has(mainRoleName);

  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(mainRoleName);
  const [editFullName, setEditFullName] = useState(user.full_name || "");
  const [editNumber, setEditNumber] = useState(user.number || "");
  const [editPassword, setEditPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingHead, setTogglingHead] = useState(false);

  useEffect(() => {
    setSelectedRole(mainRoleName);
    setEditFullName(user.full_name || "");
    setEditNumber(user.number || "");
    setEditPassword("");
  }, [mainRoleName, user.full_name, user.number]);

  // Roles available in dropdown: exclude head sub-roles (assigned via dedicated button)
  const editableRoles = availableRoles.filter((r) => !HEAD_ROLE_NAMES.has(r.value));

  const mainRoleLabel =
    editableRoles.find((r) => r.value === mainRoleName)?.label || mainRoleName;

  const handleSave = async () => {
    setSaving(true);
    if (canChangeRoles && selectedRole !== mainRoleName) {
      await onRoleChange(user.id, selectedRole);
    }
    const nameChanged = editFullName.trim() !== (user.full_name || "").trim();
    const numberChanged = editNumber.trim() !== (user.number || "").trim();
    const passwordChanged = editPassword.trim().length > 0;
    if ((nameChanged || numberChanged || passwordChanged) && onUpdateUser) {
      await onUpdateUser(user.id, {
        full_name: editFullName.trim(),
        number: editNumber.trim(),
        password: passwordChanged ? editPassword.trim() : undefined,
      });
    }
    setSaving(false);
    setEditing(false);
    setEditPassword("");
  };

  const handleCancel = () => {
    setSelectedRole(mainRoleName);
    setEditFullName(user.full_name || "");
    setEditNumber(user.number || "");
    setEditPassword("");
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить аккаунт ${user.full_name || user.number}? Это действие необратимо.`))
      return;
    setDeleting(true);
    await onDeleteUser(user.id);
    setDeleting(false);
  };

  const handleToggleHead = async () => {
    setTogglingHead(true);
    if (hasHeadSubRole) {
      await onRemoveHead(user.id);
    } else {
      await onAssignHead(user.id);
    }
    setTogglingHead(false);
  };

  return (
    <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-slate-800/80 px-5 py-4 gap-4">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="Полное имя"
              className="h-9 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={editNumber}
              onChange={(e) => setEditNumber(e.target.value)}
              placeholder="Номер телефона / логин"
              className="h-9 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-blue-500"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Новый пароль (оставьте пустым чтобы не менять)"
                className="h-9 w-full rounded-xl border border-white/10 bg-slate-900 px-3 pr-10 text-sm text-white outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                {showPassword ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{user.full_name}</span>
            <span className="text-slate-400 text-sm">{user.number || "—"}</span>
            {hasHeadSubRole && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Начальник
              </span>
            )}
          </div>
        )}

        <div className="mt-1">
          {editing && canChangeRoles ? (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none"
            >
              {editableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {mainRoleLabel}
            </span>
          )}
        </div>
      </div>

      {canManageUsers && (
        <div className="flex flex-col items-end gap-2 shrink-0">
          {!editing ? (
            <div className="flex flex-wrap gap-2 justify-end">
              {isAdmin && canBecomHead && (
                <button
                  onClick={handleToggleHead}
                  disabled={togglingHead}
                  className={`px-3 py-1.5 rounded-xl text-sm transition disabled:opacity-50 ${
                    hasHeadSubRole
                      ? "bg-amber-700/60 hover:bg-amber-600/80 text-amber-200"
                      : "bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-200"
                  }`}
                >
                  {togglingHead
                    ? "..."
                    : hasHeadSubRole
                    ? "Снять с должности"
                    : "Назначить начальником"}
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-200 transition"
              >
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-xl bg-rose-700/80 hover:bg-rose-600 text-sm text-white transition disabled:opacity-50"
              >
                {deleting ? "..." : "Удалить"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
