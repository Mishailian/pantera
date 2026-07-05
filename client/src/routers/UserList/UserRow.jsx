import { useEffect, useState } from "react";

export const UserRow = ({
  user,
  isAdmin,
  onRoleChange,
  onUpdateUser,
  onDeleteUser,
  availableRoles = [],
}) => {
  const currentRoleName = user.roles?.[0]?.name || "";

  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRoleName);
  const [editFullName, setEditFullName] = useState(user.full_name || "");
  const [editNumber, setEditNumber] = useState(user.number || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSelectedRole(currentRoleName);
    setEditFullName(user.full_name || "");
    setEditNumber(user.number || "");
  }, [currentRoleName, user.full_name, user.number]);

  const currentRoleLabel =
    availableRoles.find((role) => role.value === currentRoleName)?.label || currentRoleName;

  const handleSave = async () => {
    setSaving(true);
    if (selectedRole !== currentRoleName) {
      await onRoleChange(user.id, selectedRole);
    }
    const nameChanged = editFullName.trim() !== (user.full_name || "").trim();
    const numberChanged = editNumber.trim() !== (user.number || "").trim();
    if ((nameChanged || numberChanged) && onUpdateUser) {
      await onUpdateUser(user.id, {
        full_name: editFullName.trim(),
        number: editNumber.trim(),
      });
    }
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setSelectedRole(currentRoleName);
    setEditFullName(user.full_name || "");
    setEditNumber(user.number || "");
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить аккаунт ${user.full_name || user.number}? Это действие необратимо.`))
      return;
    setDeleting(true);
    await onDeleteUser(user.id);
    setDeleting(false);
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
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{user.full_name}</span>
            <span className="text-slate-400 text-sm">{user.number || "—"}</span>
          </div>
        )}

        <div className="mt-1">
          {editing ? (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none"
            >
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {currentRoleLabel}
            </span>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-col items-end gap-2 shrink-0">
          {!editing ? (
            <div className="flex gap-2">
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
