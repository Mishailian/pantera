import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  useAuthenticationMutation,
  useRegisterMutation,
  useGetUsersQuery,
  useGetRegistrationRolesQuery,
  apiSlice,
} from "../api/apiSlice";

import { setToken, clearAuth } from "./authSlice";
import { setTagsTable } from "./tagsSlice";
import { setUsersTable } from "./usesSlice";

import { progressCheck } from "../../progressCheck";
import { useUpdateObjectsTable } from "../../static/static";

export const Login = () => {
  const dispatch = useDispatch();
  const authToken = useSelector((state) => state.auth.token);

  const updateUsersTable = useUpdateObjectsTable(setUsersTable);
  const updateTagsTable = useUpdateObjectsTable(setTagsTable);

  const [mode, setMode] = useState("login");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [loginForm, setLoginForm] = useState({
    number: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    password: "",
    full_name: "",
    number: "",
    role_name: "",
  });

  const [auth, { isLoading: isLoginLoading }] = useAuthenticationMutation();
  const [registerUser, { isLoading: isRegisterLoading }] =
    useRegisterMutation();

  const { data: registrationRoles = [], isLoading: isRolesLoading } =
    useGetRegistrationRolesQuery(undefined, {
      skip: mode !== "register",
    });

  const availableRegistrationRoles = registrationRoles.filter(
    (role) => role?.name !== "admin" && !role?.is_extra
  );

  const users = useGetUsersQuery(undefined, {
    skip: !authToken,
  });

  useEffect(() => {
    if (authToken && users?.data) {
      progressCheck(users, updateUsersTable);
    }
  }, [authToken, users?.data, users, updateUsersTable]);

  useEffect(() => {
    if (!availableRegistrationRoles.length) return;

    setRegisterForm((prev) => {
      if (
        prev.role_name &&
        availableRegistrationRoles.some((role) => role.name === prev.role_name)
      ) {
        return prev;
      }

      return {
        ...prev,
        role_name: availableRegistrationRoles[0]?.name ?? "",
      };
    });
  }, [availableRegistrationRoles]);

  const handleLogin = async () => {
    setErrorText("");
    setSuccessText("");

    try {
      const response = await auth({ initialState: loginForm });

      if (response?.data) {
        const { token, user } = response.data;

        dispatch(apiSlice.util.resetApiState());

        dispatch(
          setToken({
            isAuth: true,
            username_id: user?.id ?? null,
            roles: user?.roles ?? [],
            token: token ?? null,
            csrf_token: null,
          })
        );

        setLoginForm({
          number: "",
          password: "",
        });

        setSuccessText("Вход выполнен успешно.");
      } else {
        setErrorText(
          response?.error?.data?.error || "Не удалось выполнить вход."
        );
      }
    } catch (error) {
      console.error(error);
      setErrorText("Ошибка при входе.");
    }
  };

  const handleRegister = async () => {
    setErrorText("");
    setSuccessText("");

    try {
      const response = await registerUser(registerForm);

      if (response?.data) {
        const { token, user } = response.data;

        dispatch(apiSlice.util.resetApiState());

        dispatch(
          setToken({
            isAuth: true,
            username_id: user?.id ?? null,
            roles: user?.roles ?? [],
            token: token ?? null,
            csrf_token: null,
          })
        );

        setRegisterForm({
          password: "",
          full_name: "",
          number: "",
          role_name: availableRegistrationRoles[0]?.name ?? "",
        });

        setSuccessText("Регистрация выполнена успешно.");
      } else {
        setErrorText(
          response?.error?.data?.error || "Не удалось зарегистрироваться."
        );
      }
    } catch (error) {
      console.error(error);
      setErrorText("Ошибка при регистрации.");
    }
  };

  const logOut = () => {
    dispatch(apiSlice.util.resetApiState());
    dispatch(clearAuth());

    setErrorText("");
    setSuccessText("");
  };

  if (authToken) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-7 shadow-2xl backdrop-blur">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Вы авторизованы
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Доступ к системе заявок открыт.
          </p>
        </div>

        {successText ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successText}
          </div>
        ) : null}

        <button
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.99]"
          onClick={logOut}
          type="button"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-7 shadow-2xl backdrop-blur">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Панель доступа
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Войдите в систему или создайте новую учетную запись.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-800/80 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setErrorText("");
            setSuccessText("");
          }}
          className={`h-11 rounded-xl text-sm font-semibold transition ${
            mode === "login"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          Вход
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("register");
            setErrorText("");
            setSuccessText("");
          }}
          className={`h-11 rounded-xl text-sm font-semibold transition ${
            mode === "register"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          Регистрация
        </button>
      </div>

      {errorText ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorText}
        </div>
      ) : null}

      {successText ? (
        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successText}
        </div>
      ) : null}

      {mode === "login" ? (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Номер телефона
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="tel"
              autoComplete="username"
              value={loginForm.number}
              onChange={(e) =>
                setLoginForm({ ...loginForm, number: e.target.value })
              }
              placeholder="+7 (999) 000-00-00"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Пароль
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              placeholder="Введите пароль"
            />
          </label>

          <button
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleLogin}
            disabled={isLoginLoading}
            type="button"
          >
            {isLoginLoading ? "Вход..." : "Войти"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Полное имя
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="text"
              autoComplete="name"
              value={registerForm.full_name}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  full_name: e.target.value,
                })
              }
              placeholder="Например: Иван Петров"
            />
          </label>

          {/* НОВЫЙ ИНПУТ: НОМЕР ТЕЛЕФОНА */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Номер телефона <span className="text-red-400">*</span>
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="tel"
              autoComplete="username"
              value={registerForm.number}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  number: e.target.value,
                })
              }
              placeholder="+7 (999) 000-00-00"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Роль
            </span>
            <select
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              value={registerForm.role_name}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  role_name: e.target.value,
                })
              }
              disabled={isRolesLoading || !availableRegistrationRoles.length}
            >
              {!availableRegistrationRoles.length ? (
                <option value="">
                  {isRolesLoading ? "Загрузка ролей..." : "Нет доступных ролей"}
                </option>
              ) : null}

              {availableRegistrationRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.description || role.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Пароль
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="password"
              autoComplete="new-password"
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  password: e.target.value,
                })
              }
              placeholder="Придумайте пароль"
            />
          </label>

          <button
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleRegister}
            disabled={
              isRegisterLoading ||
              isRolesLoading ||
              !registerForm.role_name ||
              !registerForm.number // <-- КНОПКА НЕАКТИВНА БЕЗ НОМЕРА
            }
            type="button"
          >
            {isRegisterLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </div>
      )}
    </div>
  );
};