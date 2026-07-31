import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NotificationBell } from "../../auxComponents/NotificationBell";
import { staticApi } from "../../static/static";
import { setToken, clearAuth } from "../../app/auth/authSlice";
import { Login } from "../../app/auth/Login";
import { apiSlice } from "../../app/api/apiSlice";
import { Logo } from "../../auxComponents/Logo";

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
    if (normalizedLocation === "profile-history") return "Заявки";
    if (normalizedLocation === "undeclared") return "Без подписи";
    if (normalizedLocation === "archived") return "Архив";
    if (normalizedLocation.includes("users")) {
      return usersTable[normalizedLocation.split("users")[1]] ?? "Пользователи";
    }
    return s.names[normalizedLocation] ?? "Главная";
  }, [normalizedLocation, usersTable, s.names]);

  const routes = useMemo(() => {
    const hiddenPaths = ["/profile", "/profile-history", "/auth",];
    const hiddenSidebarPaths = ["/undeclared/", "/archived/",];
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
        label: "Заявки",
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


  if (!token || !isAuth) return <Login />;

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900">
      <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6">
        <div className="mb-8 px-2">
          <Logo />
        </div>

        <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 px-2 pb-5">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Текущий раздел
            </div>

            <div
              className="mt-1 truncate text-lg font-bold text-slate-900"
              title={currentPageTitle}
            >
              {currentPageTitle}
            </div>
          </div>

          {(isHead || isAdmin) && (
            <div className="shrink-0">
              <NotificationBell />
            </div>
          )}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {routes.map((route) => (
            <button
              key={route.key}
              type="button"
              onClick={() => navigate(route.path)}
              className={`
          group relative flex w-full items-center
          rounded-xl px-4 py-3
          text-left text-sm font-semibold
          transition-all duration-200
          active:scale-[0.98]
          ${route.isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }
        `}
            >
              <span
                className={`
            absolute left-0 top-1/2 h-6 w-1
            -translate-y-1/2 rounded-r-full
            transition-all duration-200
            ${route.isActive
                    ? "bg-indigo-400 opacity-100"
                    : "bg-transparent opacity-0"
                  }
          `}
              />

              <span className="truncate">
                {route.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-h-screen flex-1 flex-col bg-stone-100 p-8">
          <div className="flex flex-1 flex-col min-w-full border border-stone-300 bg-white p-6 shadow-sm items-center">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
