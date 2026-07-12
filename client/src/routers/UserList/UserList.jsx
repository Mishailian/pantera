import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetUsersQuery,
  useUpdateUserRolesMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRegistrationRolesQuery,
  useAssignHeadMutation,
  useRemoveHeadMutation,
} from "../../app/api/apiSlice";
import { UserRow } from "./UserRow";

export const UserList = () => {
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const roleNames = currentUserRoles.map((r) => r?.name).filter(Boolean);
  const isAdmin = roleNames.includes("admin");
  const isITActor = roleNames.some((r) => ["it_department", "it_head"].includes(r));
  const isSupplyHeadActor = roleNames.includes("supply_head");
  const canManageUsers = isAdmin || isITActor || isSupplyHeadActor;
  const canChangeRoles = canManageUsers;

  const { data: users = [], isLoading, isError } = useGetUsersQuery();
  const { data: roles = [] } = useGetRegistrationRolesQuery();
  const [updateUserRoles] = useUpdateUserRolesMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [assignHead] = useAssignHeadMutation();
  const [removeHead] = useRemoveHeadMutation();

  const [numberFilter, setNumberFilter] = useState("");
  const [fullNameFilter, setFullNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const roleOptions = useMemo(() => {
    const base = [{ value: "", label: "Все роли" }];
    const mappedRoles = roles.map((role) => ({
      value: role.name,
      label: role.description || role.name,
    }));

    if (isAdmin) {
      return [...base, { value: "admin", label: "Администратор" }, ...mappedRoles];
    }

    // Фильтр доступных ролей по правам актора
    let filtered = mappedRoles;
    if (isITActor) {
      filtered = filtered.filter((r) => !["supply_manager"].includes(r.value));
    }
    if (isSupplyHeadActor) {
      filtered = filtered.filter((r) => !["it_department"].includes(r.value));
    }
    return [...base, ...filtered];
  }, [roles, isAdmin, isITActor, isSupplyHeadActor]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRoles({ userId, role: newRole }).unwrap();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert(error?.data?.error || "Не удалось изменить роль.");
    }
  };

  const handleUpdateUser = async (userId, { full_name, number, password }) => {
    try {
      await updateUser({ userId, full_name, number, password }).unwrap();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert(error?.data?.error || "Не удалось обновить данные пользователя.");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId).unwrap();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(error?.data?.error || "Не удалось удалить пользователя.");
    }
  };

  const handleAssignHead = async (userId) => {
    try {
      await assignHead(userId).unwrap();
    } catch (error) {
      console.error("Failed to assign head:", error);
      alert(error?.data?.error || "Не удалось назначить начальником.");
    }
  };

  const handleRemoveHead = async (userId) => {
    try {
      await removeHead(userId).unwrap();
    } catch (error) {
      console.error("Failed to remove head:", error);
      alert(error?.data?.error || "Не удалось снять с должности начальника.");
    }
  };

  const HEAD_ROLE_NAMES = new Set(["supply_head", "it_head"]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const number = (user?.number || "").toLowerCase();
      const fullName = (user?.full_name || "").toLowerCase();
      // Main role = first non-head role
      const mainRole = user?.roles?.find((r) => !HEAD_ROLE_NAMES.has(r.name));
      const roleName = mainRole?.name || user?.roles?.[0]?.name || "";

      const numberMatches = number.includes(numberFilter.trim().toLowerCase());
      const fullNameMatches = fullName.includes(fullNameFilter.trim().toLowerCase());
      const roleMatches = roleFilter ? roleName === roleFilter : true;

      return numberMatches && fullNameMatches && roleMatches;
    });
  }, [users, numberFilter, fullNameFilter, roleFilter]);

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
            Фильтр по номеру телефона
          </span>
          <input
            type="text"
            value={numberFilter}
            onChange={(e) => setNumberFilter(e.target.value)}
            placeholder="Введите часть номера"
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
            {roleOptions.map((role) => (
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
              canManageUsers={canManageUsers}
              canChangeRoles={canChangeRoles}
              onRoleChange={handleRoleChange}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAssignHead={handleAssignHead}
              onRemoveHead={handleRemoveHead}
              availableRoles={roleOptions.filter((role) => role.value !== "")}
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