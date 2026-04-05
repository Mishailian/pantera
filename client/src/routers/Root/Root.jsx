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
  const is_superuser = useSelector((state) => state.auth.is_superuser);
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

  const currentPageTitle = useMemo(() => {
    if (normalizedLocation.includes("users")) {
      return usersTable[normalizedLocation.split("users")[1]] ?? "users";
    }

    return s.names[normalizedLocation] ?? "Главная";
  }, [normalizedLocation, usersTable, s.names]);

  const routes = useMemo(() => {
    return Object.keys(s.paths).map((routeKey) => ({
      key: routeKey,
      label: s.names[routeKey],
      path: s.paths[routeKey],
      isActive: pathname === s.paths[routeKey],
    }));
  }, [pathname, s.names, s.paths]);

  useEffect(() => {
    if (!persistedToken) {
      dispatch(
        setToken({
          token,
          is_superuser,
          username,
          username_id,
          isAuth: true,
        })
      );
    }
  }, [dispatch, persistedToken, token, is_superuser, username, username_id]);

  if (!isAuth) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900">
      {/* SIDEBAR */}
      <aside className="flex w-[260px] shrink-0 flex-col justify-between border-r border-stone-300 bg-white px-6 py-8 shadow-sm">
        <div>
          <div className="mb-12">
            <div className="text-2xl tracking-tight">
              УралШина
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {routes.map((route) => (
              <button
                key={route.key}
                onClick={() => navigate(route.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-md transition shadow-md ${
                  route.isActive
                    ? "bg-black text-white"
                    : " bg-white hover:bg-stone-200"
                }`}
              >
                {route.label}
              </button>
            ))}
          </nav>
        </div>

      </aside>

      {/* RIGHT SIDE */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header className="flex h-[64px] items-center justify-between border-b border-stone-300 bg-white px-8">
          <h1 className="text-xl font-semibold tracking-tight">
            {currentPageTitle}
          </h1>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-stone-100">
            <div className="h-3 w-3 rounded-full bg-black" />
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex min-h-0 flex-1 flex-col bg-stone-100 p-8">
          <div className="flex flex-1 flex-col rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
