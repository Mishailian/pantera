import { useDispatch, useSelector } from "react-redux";
import { setToken } from "../../app/auth/authSlice";
import {
  apiSlice,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useGetRegistrationRolesQuery,
  useGetMyRoleRequestsQuery,
  useCreateRoleRequestMutation,
} from "../../app/api/apiSlice";

import { clearAuth } from "../../app/auth/authSlice";
import { useNavigate } from "react-router-dom";

import { useEffect, useMemo, useState } from "react";

const ROLES_REQUIRING_APPROVAL = new Set(["supply_manager", "it_department"]);

export const Profile = () => {
  const navigate = useNavigate();
  const { data: user, isLoading } = useGetCurrentUserQuery();
  const { data: roles = [], isLoading: rolesLoading } = useGetRegistrationRolesQuery();
  const { data: myRoleRequests = [] } = useGetMyRoleRequestsQuery();
  const [updateUser, { isLoading: isSaving }] = useUpdateCurrentUserMutation();
  const [createRoleRequest] = useCreateRoleRequestMutation();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [number, setNumber] = useState("");

  const pendingRoleRequest = myRoleRequests[0] ?? null;

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || "");
    setRoleName(user.roles?.[0]?.name || "");
    setNumber(user.number || "");
  }, [user]);

  const handleLogout = () => {
    dispatch(apiSlice.util.resetApiState());
    dispatch(clearAuth());
    navigate("/auth", { replace: true });
  };

  const initials = useMemo(() => {
    const source = user?.full_name || "";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("");
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-slate-500">
        Загрузка профиля...
      </div>
    );
  }

  const currentRoleName = user.roles?.[0]?.name || "";
  const currentRoleLabel =
    user.roles?.[0]?.description || currentRoleName || "Роль не назначена";

  const handleSave = async () => {
    setErrorText("");
    setSuccessText("");

    const wantsApprovalRole = ROLES_REQUIRING_APPROVAL.has(roleName) && roleName !== currentRoleName;

    try {
      // Если нужно одобрение — отправляем запрос, профиль обновляем без смены роли
      if (wantsApprovalRole) {
        // Сначала сохраняем имя/телефон (без role_name)
        const nameOrPhoneChanged =
          fullName !== (user.full_name || "") || number !== (user.number || "");

        if (nameOrPhoneChanged) {
          const updatedUser = await updateUser({
            full_name: fullName,
            number,
          }).unwrap();
          dispatch(setToken({
            token: authState.token,
            isAuth: authState.isAuth,
            csrf_token: authState.csrf_token,
            username_id: updatedUser?.id ?? authState.username_id,
            roles: updatedUser?.roles ?? authState.roles,
          }));
        }

        await createRoleRequest(roleName).unwrap();
        setEditing(false);
        setSuccessText(
          "Запрос на смену роли отправлен. Ожидайте одобрения начальника отдела."
        );
        return;
      }

      const updatedUser = await updateUser({
        full_name: fullName,
        role_name: roleName,
        number,
      }).unwrap();

      dispatch(setToken({
        token: authState.token,
        isAuth: authState.isAuth,
        csrf_token: authState.csrf_token,
        username_id: updatedUser?.id ?? authState.username_id,
        roles: updatedUser?.roles ?? authState.roles,
      }));

      setEditing(false);
      setSuccessText("Профиль успешно обновлён.");
    } catch (error) {
      console.log(error)
      setErrorText(error?.data?.error || "Не удалось сохранить изменения.");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFullName(user.full_name || "");
    setRoleName(user.roles?.[0]?.name || "");
    setNumber(user.number || ""); // ← добавить эту строку
    setErrorText("");
    setSuccessText("");
  };

  return (
    <div className="mx-auto w-full max-w-5xl">

      {pendingRoleRequest && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ожидается одобрение запроса на роль:{" "}
          <strong>{pendingRoleRequest.requested_role}</strong>. Отправлен:{" "}
          {pendingRoleRequest.created_at_formatted}
        </div>
      )}

      {errorText ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorText}
        </div>
      ) : null}

      {successText ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successText}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] mt-10">
        <div className="rounded-3xl border border-stone-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm flex justify-between flex-col">
          <div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white shadow-sm">
                {initials || "?"}
              </div>

              <div className="mt-4">
                <div className="text-xl font-semibold text-slate-900">
                  {user.full_name}
                </div>
                <div className="mt-1 text-sm text-slate-500">{user.number || "—"}</div>
              </div>

              <div className="mt-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {currentRoleLabel}
              </div>
            </div>
          </div>


          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.99]"
          >
            Выйти из аккаунта
          </button>

        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Личные данные
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Редактирование доступно прямо на этой странице.
              </p>
            </div>

            {!editing ? (
              <button
                onClick={() => {
                  setEditing(true);
                  setFullName(user.full_name || "");
                  setRoleName(currentRoleName);
                  setNumber(user.number || "");
                  setErrorText("");
                  setSuccessText("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Редактировать
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Роль
              </div>
              {editing ? (
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={rolesLoading || !roles.length}
                  className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                >
                  {!roles.length ? (
                    <option value="">
                      {rolesLoading ? "Загрузка ролей..." : "Нет доступных ролей"}
                    </option>
                  ) : null}

                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.description || role.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-base font-medium text-slate-900">
                  {currentRoleLabel}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Полное имя
              </div>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                  placeholder="Введите полное имя"
                />
              ) : (
                <div className="text-base font-medium text-slate-900">
                  {user.full_name || "—"}
                </div>
              )}
            </div>

            {/* НОВОЕ ПОЛЕ - НОМЕР ТЕЛЕФОНА */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Номер телефона
              </div>
              {editing ? (
                <input
                  type="tel"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                  placeholder="Введите номер телефона"
                />
              ) : (
                <div className="text-base font-medium text-slate-900">
                  {user.number || "—"}
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Сохранение..." : "Сохранить"}
              </button>

              <button
                onClick={handleCancel}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-stone-100"
              >
                Отмена
              </button>
            </div>
          ) : null}
        </div>

      </div>
    </div >
  );
};
