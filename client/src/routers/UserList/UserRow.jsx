import { useState } from "react";

const AVAILABLE_ROLES = ["admin", "supply_manager", "default"];

const ROLE_LABELS = {
  admin: "Администратор",
  supply_manager: "Снабженец",
  default: "Пользователь",
};

export const UserRow = ({ user, isAdmin, onRoleChange }) => {
  const currentRoleName = user.roles?.[0]?.name || "default";

  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRoleName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onRoleChange(user.id, selectedRole);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setSelectedRole(currentRoleName);
    setEditing(false);
  };

  return (
    <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-slate-800/80 px-5 py-4 gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white">{user.username}</span>
          <span className="text-slate-400 text-sm">{user.full_name}</span>
        </div>

        <div className="mt-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {ROLE_LABELS[currentRoleName] || currentRoleName}
          </span>
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-col items-end gap-2 shrink-0">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-200 transition"
            >
              Редактировать
            </button>
          ) : (
            <div className="flex flex-col gap-2 items-end">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
              >
                {AVAILABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role] || role}
                  </option>
                ))}
              </select>

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
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};