import { useSelector } from "react-redux";
import { useGetRolesQuery } from "../../app/api/apiSlice";
import { AddTag } from "./AddTag";
import { TagBlock } from "./TagBlock";

export const TagList = () => {
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const isAdmin = currentUserRoles.some((role) => role?.name === "admin");

  const {
    data: roles = [],
    isLoading,
    isError,
    error,
  } = useGetRolesQuery(undefined, {
    skip: !isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
        Доступ к разделу «Роли» есть только у администратора.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-slate-500">Загрузка ролей...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
        {error?.data?.error || "Ошибка загрузки ролей"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Роли</h1>
        <p className="mt-2 text-sm text-slate-500">
          Создание и просмотр ролей, доступных в системе.
        </p>
      </div>

      <AddTag />

      <div className="flex flex-col divide-y divide-stone-200 rounded-2xl border border-stone-300 bg-white">
        {roles.map((role, index) => (
          <TagBlock key={role.id} tag={role} index={index} />
        ))}
      </div>
    </div>
  );
};