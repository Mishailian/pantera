import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { staticApi } from "../../static/static";
import { setToken, clearAuth } from "../../app/auth/authSlice";
import { Login } from "../../app/auth/Login";
import { apiSlice } from "../../app/api/apiSlice";
import {
  useGetRoleRequestsCountQuery,
  useGetRoleRequestsQuery,
  useReviewRoleRequestMutation,
} from "../../app/api/apiSlice";

const ROLE_LABELS = {
  supply_manager:  "Отдел снабжения",
  rezo_department: "Отдел Резо",
  it_department:   "ОИТ",
};

const REQUEST_TYPE_LABELS = {
  registration: "Регистрация",
  role_change: "Смена роли",
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: countData, refetch: refetchCount } = useGetRoleRequestsCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: requests = [], refetch: refetchList } = useGetRoleRequestsQuery(undefined, {
    skip: !open,
  });
  const [reviewRequest] = useReviewRoleRequestMutation();

  const count = countData?.count ?? 0;

  const handleReview = async (requestId, action) => {
    try {
      await reviewRequest({ requestId, action }).unwrap();
      refetchCount();
      refetchList();
    } catch (e) {
      alert(e?.data?.error || "Ошибка при обработке запроса");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-stone-100 hover:bg-stone-200 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-20 w-96 rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden">
            <div className="border-b border-stone-200 px-4 py-3">
              <h3 className="font-semibold text-stone-800">Запросы на смену роли</h3>
              {count === 0 && <p className="text-sm text-stone-500 mt-0.5">Новых запросов нет</p>}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
              {requests.map((req) => (
                <div key={req.id} className="px-4 py-3 space-y-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-stone-900 text-sm">{req.user?.full_name || "—"}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${req.request_type === "registration" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {REQUEST_TYPE_LABELS[req.request_type] || req.request_type}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{req.user?.number || "—"}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {req.request_type === "registration" ? "Хочет вступить в:" : "Запрашивает роль:"}{" "}
                      <span className="font-semibold text-stone-700">{ROLE_LABELS[req.requested_role] || req.requested_role}</span>
                    </p>
                    <p className="text-xs text-stone-400">{req.created_at_formatted}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(req.id, "approve")}
                      className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReview(req.id, "reject")}
                      className="flex-1 rounded-xl bg-rose-600 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Root = () => {
  const s = staticApi();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const token = useSelector((state) => state.auth.token);
  const isAuth = useSelector((state) => state.auth.isAuth);
  const username_id = useSelector((state) => state.auth.username_id);
  const roles = useSelector((state) => state.auth.roles || []);
  const usersTable = useSelector((state) => state.users.usersTable);

  const normalizedLocation = pathname.replace(/\//g, "");

  const persistedToken = useMemo(() => {
    try {
      const persistedRoot = localStorage.getItem("persist:root");
      if (!persistedRoot) return null;
      const parsedRoot = JSON.parse(persistedRoot);
      const parsedAuth = JSON.parse(parsedRoot.auth || "{}");
      return parsedAuth.token || null;
    } catch {
      return null;
    }
  }, []);

  const roleNames = useMemo(() => roles.map((role) => role?.name).filter(Boolean), [roles]);

  const isAdmin = useMemo(() => roleNames.includes("admin"), [roleNames]);
  const isHead = useMemo(
    () =>
      roleNames.includes("supply_head") ||
      roleNames.includes("rezo_head") ||
      roleNames.includes("it_head"),
    [roleNames]
  );
  const isIT = useMemo(
    () => roleNames.includes("it_department") || roleNames.includes("it_head"),
    [roleNames]
  );

  // Кто видит управление заявками (store/undeclared/archived)
  const canSeeManagementRequests = useMemo(
    () => roleNames.some((r) => ["admin", "supply_manager", "supply_head", "rezo_department", "rezo_head"].includes(r)),
    [roleNames]
  );

  // Кто может создавать заявки
  const canCreateRequests = useMemo(() => !isIT, [isIT]);

  // Кто видит список пользователей
  const canManageUsers = useMemo(
    () => roleNames.some((r) => ["admin", "it_department", "it_head", "supply_head"].includes(r)),
    [roleNames]
  );

  const currentPageTitle = useMemo(() => {
    if (normalizedLocation === "profile") return "Профиль";
    if (normalizedLocation === "profile-history") return "История";
    if (normalizedLocation === "store") return "Созданные заявки";
    if (normalizedLocation === "undeclared") return "Без подписи";
    if (normalizedLocation === "archived") return "Архив";
    if (normalizedLocation.includes("users")) {
      return usersTable[normalizedLocation.split("users")[1]] ?? "Пользователи";
    }
    return s.names[normalizedLocation] ?? "Главная";
  }, [normalizedLocation, usersTable, s.names]);

  const routes = useMemo(() => {
    const hiddenPaths = ["/profile", "/profile-history", "/auth"];
    const hiddenSidebarPaths = ["/undeclared/", "/archived/"];
    const supplyTabsPaths = ["/store/", "/undeclared/", "/archived/"];
    const managementRequestsPaths = ["/store/", "/undeclared/", "/archived/"];
    const adminOnlyPaths = ["/tagList/"];

    const baseRoutes = Object.keys(s.paths)
      .filter((routeKey) => {
        const path = s.paths[routeKey];

        if (!path) return false;
        if (hiddenPaths.includes(path)) return false;
        if (hiddenSidebarPaths.includes(path)) return false;
        if (adminOnlyPaths.includes(path)) return isAdmin;

        if (managementRequestsPaths.includes(path)) return canSeeManagementRequests;

        if (path === "/addPost/") return canCreateRequests;

        if (path === "/users/" || path.startsWith("/users")) return canManageUsers;

        return true;
      })
      .map((routeKey) => {
        const path = s.paths[routeKey];
        const isActive =
          path === "/store/"
            ? supplyTabsPaths.includes(pathname)
            : pathname === path;

        return {
          key: `base-${routeKey}`,
          label: s.names[routeKey],
          path,
          isActive,
        };
      });

    const extraRoutes = [
      {
        key: "extra-profile",
        label: "Профиль",
        path: "/profile",
        isActive: pathname === "/profile",
      },
      {
        key: "extra-profile-history",
        label: "История",
        path: "/profile-history",
        isActive: pathname === "/profile-history",
      },
    ];

    return [...extraRoutes, ...baseRoutes];
  }, [pathname, s.names, s.paths, isAdmin, canSeeManagementRequests, canCreateRequests, canManageUsers]);

  useEffect(() => {
    if (!persistedToken) {
      dispatch(setToken({ token, username_id, roles, isAuth: true }));
    }
  }, [dispatch, persistedToken, token, username_id, roles]);

  useEffect(() => {
    if (!token || !isAuth) {
      if (pathname !== "/auth") navigate("/auth", { replace: true });
      return;
    }
    if (pathname === "/" || pathname === "/auth") navigate("/profile", { replace: true });
  }, [token, isAuth, pathname, navigate]);

  const handleLogout = () => {
    dispatch(apiSlice.util.resetApiState());
    dispatch(clearAuth());
    navigate("/auth", { replace: true });
  };

  if (!token || !isAuth) return <Login />;

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-stone-300 bg-white px-6 py-8 shadow-sm">
        <div>
          <div className="mb-12">
            <div className="text-2xl tracking-tight">Уралшина</div>
          </div>

          <nav className="flex flex-col gap-2">
            {routes.map((route) => (
              <button
                key={route.key}
                onClick={() => navigate(route.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-md transition shadow-md ${
                  route.isActive
                    ? "bg-black text-white"
                    : "bg-white hover:bg-stone-200"
                }`}
              >
                {route.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.99]"
        >
          Выйти из аккаунта
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] items-center justify-between border-b border-stone-300 bg-white px-8">
          <h1 className="text-xl font-semibold tracking-tight">{currentPageTitle}</h1>

          <div className="flex items-center gap-3">
            {(isHead || isAdmin) && <NotificationBell />}

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-stone-100">
              <div className="h-3 w-3 rounded-full bg-black" />
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col bg-stone-100 p-8">
          <div className="flex flex-1 flex-col rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
