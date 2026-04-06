import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  useAuthenticationMutation,
  useRegisterMutation,
  useGetTagsQuery,
  useGetUsersQuery,
} from "../api/apiSlice";

import { setToken } from "./authSlice";
import { setTagsTable } from "./tagsSlice";
import { setUsersTable } from "./usesSlice";

import { progressCheck } from "../../progressCheck";
import { useUpdateObjectsTable } from "../../static/static";

export const Login = () => {
  const dispatch = useDispatch();
  const authToken = useSelector((state) => state.auth.token);

  const updateUsersTable = useMemo(() => useUpdateObjectsTable(setUsersTable), []);
  const updateTagsTable = useMemo(() => useUpdateObjectsTable(setTagsTable), []);

  const [mode, setMode] = useState("login");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    full_name: "",
  });

  const [auth, { isLoading: isLoginLoading }] = useAuthenticationMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterMutation();


  const users = useGetUsersQuery(undefined, {
    skip: !authToken,
  });


  useEffect(() => {
    if (authToken && users?.data) {
      console.log(users);
      progressCheck(users, updateUsersTable);
    }
  }, [authToken, users?.data, users, updateUsersTable]);

  const handleLogin = async () => {
    setErrorText("");
    setSuccessText("");

    try {
      const response = await auth({ initialState: loginForm });

      if (response?.data) {
        const { token, user } = response.data;

        dispatch(
          setToken({
            isAuth: true,
            username: user?.username ?? null,
            username_id: user?.id ?? null,
            is_superuser: user?.is_superuser ?? false,
            token: token ?? null,
          })
        );

        setLoginForm({
          username: "",
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

        dispatch(
          setToken({
            isAuth: true,
            username: user?.username ?? null,
            username_id: user?.id ?? null,
            is_superuser: user?.is_superuser ?? false,
            token: token ?? null,
          })
        );

        setRegisterForm({
          username: "",
          password: "",
          full_name: "",
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
    dispatch(
      setToken({
        token: null,
        isAuth: false,
        is_superuser: null,
        username: null,
        username_id: null,
      })
    );

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
              Логин
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="text"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              placeholder="Введите логин"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Пароль
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="password"
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Логин
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="text"
              value={registerForm.username}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  username: e.target.value,
                })
              }
              placeholder="Придумайте логин"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Пароль
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              type="password"
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
            disabled={isRegisterLoading}
            type="button"
          >
            {isRegisterLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </div>
      )}
    </div>
  );
};
