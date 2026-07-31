import { useMemo } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";

const getRoleName = (role) => {
  if (typeof role === "string") {
    return role;
  }

  return role?.name || null;
};

const TAB_CLASS = ({ isActive }) => `
  inline-flex min-h-11 items-center justify-center
  rounded-xl px-4 text-sm font-bold
  transition
  ${isActive
    ? "bg-slate-900 text-white shadow-sm"
    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
  }
`;

export const ProfileHistory = () => {
  const location = useLocation();

  const roles = useSelector(
    (state) => state.auth.roles || []
  );

  const roleNames = useMemo(
    () =>
      roles
        .map(getRoleName)
        .filter(Boolean),
    [roles]
  );

  const isAdmin =
    roleNames.includes("admin");

  const canViewAccountHistory =
    roleNames.some((roleName) =>
      [
        "admin",
        "supply_manager",
        "supply_head",
        "it_department",
        "it_head",
      ].includes(roleName)
    );

  const isProfileHistoryRoot =
    location.pathname === "/profile-history" ||
    location.pathname === "/profile-history/";

  if (isProfileHistoryRoot) {
    return (
      <Navigate
        to="/profile-history/department/page/1"
        replace
      />
    );
  }

  return (
    <div className="min-w-full">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            История заявок
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Заявки пользователя, отдела и история изменений.
          </p>
        </div>

        <nav className="flex flex-wrap gap-3 bg-slate-50/70 px-6 py-4 sm:px-8">
          <NavLink
            to="/profile-history/department/page/1"
            className={TAB_CLASS}
          >
            Заявки отдела
          </NavLink>

          <NavLink
            to="/profile-history/my/page/1"
            className={TAB_CLASS}
          >
            Мои заявки
          </NavLink>

          {canViewAccountHistory ? (
            <NavLink
              to="/profile-history/accounts/page/1"
              className={TAB_CLASS}
            >
              История аккаунтов
            </NavLink>
          ) : null}

          {isAdmin ? (
            <NavLink
              to="/profile-history/deleted/page/1"
              className={({ isActive }) => `
                inline-flex min-h-11 items-center justify-center
                rounded-xl px-4 text-sm font-bold transition
                ${isActive
                  ? "bg-rose-600 text-white shadow-sm"
                  : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                }
              `}
            >
              Удалённые заявки
            </NavLink>
          ) : null}
        </nav>
      </section>

      <Outlet />
    </div>
  );
};
