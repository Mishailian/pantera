import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { staticApi } from "../../static/static";
import { setToken } from "../../app/auth/authSlice";
import { Login } from "../../app/auth/Login";

export const Root = () => {
  const s = staticApi();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const token = useSelector((state) => state.auth.token);
  const isAuth = useSelector((state) => state.auth.isAuth);
  const username = useSelector((state) => state.auth.username);
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

  const roleNames = useMemo(() => {
    return roles.map((role) => role?.name).filter(Boolean);
  }, [roles]);

  const canSeeSupplySections = useMemo(() => {
    return roleNames.includes("admin") || roleNames.includes("supply_manager");
  }, [roleNames]);

  const currentPageTitle = useMemo(() => {
    if (normalizedLocation === "profile") return "Профиль";
    if (normalizedLocation === "profile-history") return "История";
    if (normalizedLocation === "auth") return "Вход";
    if (normalizedLocation === "store") return "Заявки";
    if (normalizedLocation === "undeclared") return "Без подписи";
    if (normalizedLocation === "archived") return "Архив";

    if (normalizedLocation.includes("users")) {
      return usersTable[normalizedLocation.split("users")[1]] ?? "users";
    }

    return s.names[normalizedLocation] ?? "Главная";
  }, [normalizedLocation, usersTable, s.names]);

  const routes = useMemo(() => {
    const hiddenPaths = ["/profile", "/profile-history"];
    // Прячем эти два пути из левого меню, так как они теперь внутри /store/
    const hiddenSidebarPaths = ["/undeclared/", "/archived/"]; 
    const hiddenForWorkers = ["/users/"];
    const supplyOnlyPaths = ["/store/", "/undeclared/", "/archived/", "/tagList/"];
    const supplyTabsPaths = ["/store/", "/undeclared/", "/archived/"];

    const baseRoutes = Object.keys(s.paths)
      .filter((routeKey) => {
        const path = s.paths[routeKey];

        if (!path) return false;
        if (hiddenPaths.includes(path)) return false;
        if (hiddenSidebarPaths.includes(path)) return false; // Скрываем из сайдбара

        if (hiddenForWorkers.includes(path) || path.startsWith("/users")) {
          return canSeeSupplySections;
        }

        if (supplyOnlyPaths.includes(path)) {
          return canSeeSupplySections;
        }

        return true;
      })
      .map((routeKey) => {
        const path = s.paths[routeKey];
        
        // Левая кнопка "Заявки" должна быть активна, если мы находимся в любом из трёх табов
        const isActive = path === "/store/" 
          ? supplyTabsPaths.includes(pathname) 
          : pathname === path;

        return {
          key: `base-${routeKey}`,
          label: path === "/store/" ? "Заявки" : s.names[routeKey],
          path: path,
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
  }, [pathname, s.names, s.paths, canSeeSupplySections]);

  useEffect(() => {
    if (!persistedToken) {
      dispatch(
        setToken({
          token,
          username,
          username_id,
          roles,
          isAuth: true,
        })
      );
    }
  }, [dispatch, persistedToken, token, username, username_id, roles]);

  useEffect(() => {
    if (!token || !isAuth) {
      if (pathname !== "/auth") {
        navigate("/auth", { replace: true });
      }
      return;
    }

    if (pathname === "/" || pathname === "/auth") {
      navigate("/profile", { replace: true });
    }
  }, [token, isAuth, pathname, navigate]);

  if (!token || !isAuth) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900">
      <aside className="flex w-[260px] shrink-0 flex-col justify-between border-r border-stone-300 bg-white px-6 py-8 shadow-sm">
        <div>
          <div className="mb-12">
            <div className="text-2xl tracking-tight">УралШина</div>
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] items-center justify-between border-b border-stone-300 bg-white px-8">
          <h1 className="text-xl font-semibold tracking-tight">
            {currentPageTitle}
          </h1>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-stone-100">
            <div className="h-3 w-3 rounded-full bg-black" />
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