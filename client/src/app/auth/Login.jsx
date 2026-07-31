import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  apiSlice,
  useAuthenticationMutation,
  useGetRegistrationRolesQuery,
  useGetUsersQuery,
  useRegisterMutation,
} from "../api/apiSlice";

import { clearAuth, setToken } from "./authSlice";
import { setUsersTable } from "./usesSlice";

import { progressCheck } from "../../progressCheck";
import { useUpdateObjectsTable } from "../../static/static";


const normalizeUserRoles = (user) => {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles;
  }

  if (user?.role) {
    return [user.role];
  }

  if (user?.role_name) {
    return [
      {
        name: user.role_name,
        description:
          user.role_label ||
          user.role_name,
      },
    ];
  }

  return [];
};


export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authToken = useSelector(
    (state) => state.auth.token
  );

  const updateUsersTable =
    useUpdateObjectsTable(setUsersTable);

  const [mode, setMode] =
    useState("login");

  const [errorText, setErrorText] =
    useState("");

  const [successText, setSuccessText] =
    useState("");

  const [loginForm, setLoginForm] =
    useState({
      number: "",
      password: "",
    });

  const [registerForm, setRegisterForm] =
    useState({
      password: "",
      full_name: "",
      number: "",
      role_name: "",
    });

  const [
    auth,
    { isLoading: isLoginLoading },
  ] = useAuthenticationMutation();

  const [
    registerUser,
    { isLoading: isRegisterLoading },
  ] = useRegisterMutation();

  const {
    data: registrationRoles = [],
    isLoading: isRolesLoading,
  } = useGetRegistrationRolesQuery(
    undefined,
    {
      skip: mode !== "register",
    }
  );

  const availableRegistrationRoles =
    useMemo(() => {
      return registrationRoles.filter(
        (role) =>
          role?.name &&
          role.name !== "admin"
      );
    }, [registrationRoles]);

  const usersQuery = useGetUsersQuery(
    undefined,
    {
      skip: !authToken,
    }
  );

  useEffect(() => {
    if (
      !authToken ||
      !usersQuery.data
    ) {
      return;
    }

    progressCheck(
      usersQuery,
      updateUsersTable
    );
  }, [
    authToken,
    usersQuery.data,
    usersQuery.isLoading,
    usersQuery.isError,
    updateUsersTable,
  ]);

  useEffect(() => {
    if (
      !availableRegistrationRoles.length
    ) {
      return;
    }

    setRegisterForm((previous) => {
      const selectedRoleStillExists =
        availableRegistrationRoles.some(
          (role) =>
            role.name ===
            previous.role_name
        );

      if (
        previous.role_name &&
        selectedRoleStillExists
      ) {
        return previous;
      }

      return {
        ...previous,
        role_name:
          availableRegistrationRoles[0]
            ?.name || "",
      };
    });
  }, [availableRegistrationRoles]);


  const saveAuthData = (
    responseData
  ) => {
    const token =
      responseData?.token || null;

    const user =
      responseData?.user || null;

    if (!token || !user) {
      throw new Error(
        "Сервер не вернул пользователя или токен"
      );
    }

    const normalizedRoles =
      normalizeUserRoles(user);

    dispatch(
      apiSlice.util.resetApiState()
    );

    dispatch(
      setToken({
        isAuth: true,
        username_id: user.id ?? null,
        roles: normalizedRoles,
        token,
        csrf_token: null,
      })
    );
  };


  const handleLogin = async () => {
    setErrorText("");
    setSuccessText("");

    if (
      !loginForm.number.trim() ||
      !loginForm.password
    ) {
      setErrorText(
        "Введите номер телефона и пароль."
      );

      return;
    }

    try {
      const response = await auth({
        initialState: {
          number:
            loginForm.number.trim(),
          password:
            loginForm.password,
        },
      }).unwrap();

      saveAuthData(response);

      setLoginForm({
        number: "",
        password: "",
      });
      navigate("/profile", { replace: true });

      setSuccessText(
        "Вход выполнен успешно."
      );
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      if (error?.data?.pending) {
        setSuccessText(
          error.data.message ||
          "Аккаунт ожидает подтверждения начальником отдела. Попробуйте войти позже."
        );

        return;
      }

      setErrorText(
        error?.data?.error ||
        error?.message ||
        "Не удалось выполнить вход."
      );
    }
  };


  const handleRegister = async () => {
    setErrorText("");
    setSuccessText("");

    const payload = {
      full_name:
        registerForm.full_name.trim(),

      number:
        registerForm.number.trim(),

      password:
        registerForm.password,

      role_name:
        registerForm.role_name,
    };

    if (
      !payload.full_name ||
      !payload.number ||
      !payload.password ||
      !payload.role_name
    ) {
      setErrorText(
        "Заполните имя, номер телефона, роль и пароль."
      );

      return;
    }

    try {
      const response =
        await registerUser(
          payload
        ).unwrap();

      if (response?.pending) {
        setSuccessText(
          response.message ||
          "Аккаунт создан и ожидает подтверждения начальника отдела."
        );

        setRegisterForm({
          password: "",
          full_name: "",
          number: "",
          role_name:
            availableRegistrationRoles[0]
              ?.name || "",
        });

        setMode("login");

        return;
      }

      saveAuthData(response);

      setRegisterForm({
        password: "",
        full_name: "",
        number: "",
        role_name:
          availableRegistrationRoles[0]
            ?.name || "",
      });

      setSuccessText(
        "Регистрация выполнена успешно."
      );
      navigate("/profile", { replace: true });

    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      setErrorText(
        error?.data?.error ||
        error?.message ||
        "Не удалось зарегистрироваться."
      );
    }
  };


  const logOut = () => {
    dispatch(
      apiSlice.util.resetApiState()
    );

    dispatch(clearAuth());

    setErrorText("");
    setSuccessText("");
  };


  const handleLoginKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !isLoginLoading
    ) {
      handleLogin();
    }
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
          type="button"
          onClick={logOut}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.99]"
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
          Войдите в систему или создайте новую учётную запись.
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
          className={`
            h-11 rounded-xl text-sm font-semibold transition
            ${mode === "login"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
            }
          `}
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
          className={`
            h-11 rounded-xl text-sm font-semibold transition
            ${mode === "register"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
            }
          `}
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
        <div
          className="space-y-4"
          onKeyDown={
            handleLoginKeyDown
          }
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Номер телефона
            </span>

            <input
              type="tel"
              autoComplete="username"
              value={
                loginForm.number
              }
              onChange={(event) =>
                setLoginForm(
                  (previous) => ({
                    ...previous,
                    number:
                      event.target.value,
                  })
                )
              }
              placeholder="+7 (999) 000-00-00"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Пароль
            </span>

            <input
              type="password"
              autoComplete="current-password"
              value={
                loginForm.password
              }
              onChange={(event) =>
                setLoginForm(
                  (previous) => ({
                    ...previous,
                    password:
                      event.target.value,
                  })
                )
              }
              placeholder="Введите пароль"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <button
            type="button"
            onClick={handleLogin}
            disabled={
              isLoginLoading
            }
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoginLoading
              ? "Вход..."
              : "Войти"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Полное имя
            </span>

            <input
              type="text"
              autoComplete="name"
              value={
                registerForm.full_name
              }
              onChange={(event) =>
                setRegisterForm(
                  (previous) => ({
                    ...previous,
                    full_name:
                      event.target.value,
                  })
                )
              }
              placeholder="Например: Иван Петров"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Номер телефона{" "}
              <span className="text-red-400">
                *
              </span>
            </span>

            <input
              type="tel"
              autoComplete="username"
              value={
                registerForm.number
              }
              onChange={(event) =>
                setRegisterForm(
                  (previous) => ({
                    ...previous,
                    number:
                      event.target.value,
                  })
                )
              }
              placeholder="+7 (999) 000-00-00"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Роль
            </span>

            <select
              value={
                registerForm.role_name
              }
              onChange={(event) =>
                setRegisterForm(
                  (previous) => ({
                    ...previous,
                    role_name:
                      event.target.value,
                  })
                )
              }
              disabled={
                isRolesLoading ||
                !availableRegistrationRoles.length
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!availableRegistrationRoles.length ? (
                <option value="">
                  {isRolesLoading
                    ? "Загрузка ролей..."
                    : "Нет доступных ролей"}
                </option>
              ) : null}

              {availableRegistrationRoles.map(
                (role) => (
                  <option
                    key={
                      role.id ||
                      role.name
                    }
                    value={role.name}
                  >
                    {role.description ||
                      role.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Пароль
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={
                registerForm.password
              }
              onChange={(event) =>
                setRegisterForm(
                  (previous) => ({
                    ...previous,
                    password:
                      event.target.value,
                  })
                )
              }
              placeholder="Придумайте пароль"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <button
            type="button"
            onClick={handleRegister}
            disabled={
              isRegisterLoading ||
              isRolesLoading ||
              !registerForm.full_name.trim() ||
              !registerForm.role_name ||
              !registerForm.number.trim() ||
              !registerForm.password
            }
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegisterLoading
              ? "Регистрация..."
              : "Зарегистрироваться"}
          </button>
        </div>
      )}
    </div>
  );
};
