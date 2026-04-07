import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useGetUsersQuery, useUpdateUserRolesMutation } from "../../app/api/apiSlice";
import { UserRow } from "./UserRow";

const ROLE_OPTIONS = [
  { value: "", label: "Все роли" },
  { value: "admin", label: "Администратор" },
  { value: "supply_manager", label: "Снабженец" },
  { value: "default", label: "Пользователь" },
];

export const UserList = () => {
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const isAdmin = currentUserRoles.some((role) => role?.name === "admin");

  const { data: users = [], isLoading, isError } = useGetUsersQuery();
  const [updateUserRoles] = useUpdateUserRolesMutation();

  const [usernameFilter, setUsernameFilter] = useState("");
  const [fullNameFilter, setFullNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRoles({ userId, role: newRole }).unwrap();
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const username = (user?.username || "").toLowerCase();
      const fullName = (user?.full_name || "").toLowerCase();
      const roleName = user?.roles?.[0]?.name || "";

      const usernameMatches = username.includes(usernameFilter.trim().toLowerCase());
      const fullNameMatches = fullName.includes(fullNameFilter.trim().toLowerCase());
      const roleMatches = roleFilter ? roleName === roleFilter : true;

      return usernameMatches && fullNameMatches && roleMatches;
    });
  }, [users, usernameFilter, fullNameFilter, roleFilter]);

  if (isLoading) {
    return <div className="mt-4 ml-24 text-gray-400">Загрузка...</div>;
  }

  if (isError) {
    return <div className="mt-4 ml-24 text-red-400">Ошибка загрузки пользователей</div>;
  }

  return (
    <div className="mt-4 ml-24 max-w-5xl">
      <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Фильтр по логину
          </span>
          <input
            type="text"
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            placeholder="Введите часть логина"
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Фильтр по полному имени
          </span>
          <input
            type="text"
            value={fullNameFilter}
            onChange={(e) => setFullNameFilter(e.target.value)}
            placeholder="Введите часть имени"
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Фильтр по роли
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3 text-sm text-slate-400">
        Найдено пользователей: {filteredUsers.length}
      </div>

      <div className="flex flex-col gap-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isAdmin={isAdmin}
              onRoleChange={handleRoleChange}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-5 py-4 text-slate-300">
            Пользователи по заданным фильтрам не найдены.
          </div>
        )}
      </div>
    </div>
  );
};