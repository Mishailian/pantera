import {
  useMemo,
  useState,
} from "react";

import {
  useSelector,
} from "react-redux";

import {
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useAssignHeadMutation,
  useDeleteUserMutation,
  useGetRegistrationRolesQuery,
  useGetUsersQuery,
  useRemoveHeadMutation,
  useUpdateUserMutation,
  useUpdateUserRolesMutation,
} from "../../app/api/apiSlice";

import {
  UserRow,
} from "./UserRow";


const HEAD_ROLE_NAMES =
  new Set([
    "supply_head",
    "it_head",
  ]);


const normalizeRoleName = (
  role
) => {
  if (
    typeof role ===
    "string"
  ) {
    return role;
  }

  return role?.name || "";
};


export const UserList = () => {
  const currentUserRoles =
    useSelector(
      (state) =>
        state.auth.roles ||
        []
    );

  const roleNames =
    useMemo(
      () =>
        Array.isArray(
          currentUserRoles
        )
          ? currentUserRoles
            .map(
              normalizeRoleName
            )
            .filter(Boolean)
          : [],
      [currentUserRoles]
    );

  const isAdmin =
    roleNames.includes(
      "admin"
    );

  const isITActor =
    roleNames.some(
      (roleName) =>
        [
          "it_department",
          "it_head",
        ].includes(roleName)
    );

  const isSupplyHeadActor =
    roleNames.includes(
      "supply_head"
    );

  const canManageUsers =
    isAdmin ||
    isITActor ||
    isSupplyHeadActor;

  const canChangeRoles =
    canManageUsers;

  const {
    data: usersData = [],
    isLoading,
    isError,
  } = useGetUsersQuery();

  const {
    data: rolesData = [],
    isLoading:
    isRolesLoading,
  } =
    useGetRegistrationRolesQuery();

  const [updateUserRoles] =
    useUpdateUserRolesMutation();

  const [updateUser] =
    useUpdateUserMutation();

  const [deleteUser] =
    useDeleteUserMutation();

  const [assignHead] =
    useAssignHeadMutation();

  const [removeHead] =
    useRemoveHeadMutation();

  const [
    numberFilter,
    setNumberFilter,
  ] = useState("");

  const [
    fullNameFilter,
    setFullNameFilter,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("");

  const users =
    Array.isArray(usersData)
      ? usersData
      : usersData?.items || [];

  const roles =
    Array.isArray(rolesData)
      ? rolesData
      : rolesData?.items || [];

  const roleOptions =
    useMemo(() => {
      const mappedRoles =
        roles
          .filter(
            (role) =>
              !HEAD_ROLE_NAMES.has(
                role?.name
              )
          )
          .map((role) => ({
            value:
              role.name,

            label:
              role.description ||
              role.name,
          }));

      if (isAdmin) {
        const hasAdmin =
          mappedRoles.some(
            (role) =>
              role.value ===
              "admin"
          );

        return hasAdmin
          ? mappedRoles
          : [
            {
              value: "admin",
              label:
                "Администратор",
            },
            ...mappedRoles,
          ];
      }

      if (isITActor) {
        return mappedRoles.filter(
          (role) =>
            ![
              "supply_manager",
            ].includes(
              role.value
            )
        );
      }

      if (
        isSupplyHeadActor
      ) {
        return mappedRoles.filter(
          (role) =>
            ![
              "it_department",
            ].includes(
              role.value
            )
        );
      }

      return mappedRoles;
    }, [
      roles,
      isAdmin,
      isITActor,
      isSupplyHeadActor,
    ]);

  const filterRoleOptions =
    useMemo(
      () => [
        {
          value: "",
          label:
            "Все роли",
        },
        ...roleOptions,
      ],
      [roleOptions]
    );

  const handleRoleChange =
    async (
      userId,
      newRole
    ) => {
      try {
        await updateUserRoles({
          userId,
          role: newRole,
        }).unwrap();
      } catch (error) {
        console.error(
          "Failed to update role:",
          error
        );

        alert(
          error?.data?.error ||
          "Не удалось изменить роль."
        );

        throw error;
      }
    };

  const handleUpdateUser =
    async (
      userId,
      {
        full_name,
        number,
        password,
      }
    ) => {
      try {
        await updateUser({
          userId,
          full_name,
          number,
          ...(password
            ? { password }
            : {}),
        }).unwrap();
      } catch (error) {
        console.error(
          "Failed to update user:",
          error
        );

        alert(
          error?.data?.error ||
          "Не удалось обновить данные пользователя."
        );

        throw error;
      }
    };

  const handleDeleteUser =
    async (userId) => {
      try {
        await deleteUser(
          userId
        ).unwrap();
      } catch (error) {
        console.error(
          "Failed to delete user:",
          error
        );

        alert(
          error?.data?.error ||
          "Не удалось удалить пользователя."
        );

        throw error;
      }
    };

  const handleAssignHead = async (userId) => {
    try {
      await assignHead(userId).unwrap();
    } catch (error) {
      console.error(
        "Failed to assign head:",
        error
      );

      alert(
        error?.data?.error ||
        "Не удалось назначить начальником."
      );

      throw error;
    }
  };

  const handleRemoveHead = async (userId) => {
    try {
      await removeHead(userId).unwrap();
    } catch (error) {
      console.error(
        "Failed to remove head:",
        error
      );

      alert(
        error?.data?.error ||
        "Не удалось снять с должности начальника."
      );

      throw error;
    }
  };

  const filteredUsers =
    useMemo(() => {
      const normalizedNumber =
        numberFilter
          .trim()
          .toLowerCase();

      const normalizedName =
        fullNameFilter
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const number =
            String(
              user?.number ||
              ""
            ).toLowerCase();

          const fullName =
            String(
              user?.full_name ||
              ""
            ).toLowerCase();

          const userRoleNames =
            Array.isArray(
              user?.roles
            )
              ? user.roles
                .map(
                  normalizeRoleName
                )
                .filter(Boolean)
              : [];

          const roleMatches =
            roleFilter
              ? userRoleNames.includes(
                roleFilter
              )
              : true;

          return (
            number.includes(
              normalizedNumber
            ) &&
            fullName.includes(
              normalizedName
            ) &&
            roleMatches
          );
        }
      );
    }, [
      users,
      numberFilter,
      fullNameFilter,
      roleFilter,
    ]);

  if (
    isLoading ||
    isRolesLoading
  ) {
    return (
      <div
        className="
          flex min-h-[360px]
          items-center justify-center
          rounded-2xl border
          border-slate-200 bg-white
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto h-9 w-9
              animate-spin
              rounded-full border-4
              border-slate-200
              border-t-blue-600
            "
          />

          <p
            className="
              mt-4 text-sm
              font-bold
              text-slate-500
            "
          >
            Загружаем пользователей...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="
          rounded-2xl border
          border-rose-200
          bg-rose-50 p-8
          text-center
        "
      >
        <h2
          className="
            text-lg font-black
            text-rose-700
          "
        >
          Не удалось загрузить пользователей
        </h2>
      </div>
    );
  }

  return (
    <main
      className="
        min-w-0 space-y-5
      "
    >
      <section
        className="
          overflow-hidden
          rounded-2xl border
          border-slate-200
          bg-white shadow-sm
        "
      >
        <header
          className="
            flex flex-col gap-5
            border-b
            border-slate-100
            px-5 py-6
            sm:px-7
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div
            className="
              flex min-w-0
              items-start gap-4
            "
          >
            <div
              className="
                flex h-12 w-12
                shrink-0 items-center
                justify-center
                rounded-xl
                border border-blue-100
                bg-blue-50
                text-blue-600
              "
            >
              <UsersRound className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div
                className="
                  flex flex-wrap
                  items-center gap-2
                "
              >
                <span
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-full
                    border border-blue-200
                    bg-blue-50 px-3 py-1
                    text-xs font-bold
                    text-blue-700
                  "
                >
                  <ShieldCheck className="h-3.5 w-3.5" />

                  Управление доступом
                </span>

                <span
                  className="
                    rounded-full border
                    border-slate-200
                    bg-slate-50 px-3 py-1
                    text-xs font-bold
                    text-slate-500
                  "
                >
                  Пользователей:{" "}
                  {users.length}
                </span>
              </div>

              <h1
                className="
                  mt-3 text-2xl
                  font-black tracking-tight
                  text-slate-950
                  sm:text-3xl
                "
              >
                Пользователи
              </h1>

              <p
                className="
                  mt-1 text-sm
                  font-medium
                  text-slate-500
                "
              >
                Изменение данных, ролей и руководителей отделов
              </p>
            </div>
          </div>

          <div
            className="
              rounded-xl border
              border-slate-200
              bg-slate-50
              px-5 py-3
            "
          >
            <div
              className="
                text-[10px] font-black
                uppercase
                tracking-[0.12em]
                text-slate-400
              "
            >
              Найдено
            </div>

            <div
              className="
                mt-1 text-2xl
                font-black
                text-slate-950
              "
            >
              {filteredUsers.length}
            </div>
          </div>
        </header>

        <div
          className="
            grid grid-cols-1
            gap-3 bg-slate-50/70
            p-4 sm:p-5
            lg:grid-cols-3
          "
        >
          <label className="relative block min-w-0">
            <span
              className="
                pointer-events-none
                absolute left-4
                top-2.5 z-10
                text-[10px]
                font-black uppercase
                tracking-[0.12em]
                text-slate-400
              "
            >
              Номер
            </span>

            <input
              type="search"
              value={numberFilter}
              onChange={(event) =>
                setNumberFilter(
                  event.target.value
                )
              }
              placeholder="Телефон или логин"
              className="
                h-[58px] w-full
                rounded-xl border
                border-slate-200
                bg-white px-4
                pb-1 pt-5 pr-11
                text-sm font-semibold
                text-slate-900
                outline-none transition
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-100
              "
            />

            <Search
              className="
                pointer-events-none
                absolute right-4
                top-1/2 h-4 w-4
                -translate-y-1/2
                text-slate-400
              "
            />
          </label>

          <label className="relative block min-w-0">
            <span
              className="
                pointer-events-none
                absolute left-4
                top-2.5 z-10
                text-[10px]
                font-black uppercase
                tracking-[0.12em]
                text-slate-400
              "
            >
              Полное имя
            </span>

            <input
              type="search"
              value={fullNameFilter}
              onChange={(event) =>
                setFullNameFilter(
                  event.target.value
                )
              }
              placeholder="Введите имя"
              className="
                h-[58px] w-full
                rounded-xl border
                border-slate-200
                bg-white px-4
                pb-1 pt-5 pr-11
                text-sm font-semibold
                text-slate-900
                outline-none transition
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-100
              "
            />

            <UserRound
              className="
                pointer-events-none
                absolute right-4
                top-1/2 h-4 w-4
                -translate-y-1/2
                text-slate-400
              "
            />
          </label>

          <label className="relative block min-w-0">
            <span
              className="
                pointer-events-none
                absolute left-4
                top-2.5 z-10
                text-[10px]
                font-black uppercase
                tracking-[0.12em]
                text-slate-400
              "
            >
              Роль
            </span>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="
                h-[58px] w-full
                appearance-none
                rounded-xl border
                border-slate-200
                bg-white px-4
                pb-1 pt-5
                text-sm font-semibold
                text-slate-900
                outline-none transition
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-100
              "
            >
              {filterRoleOptions.map(
                (role) => (
                  <option
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </section>

      <section
        className="
          space-y-3
          rounded-2xl border
          border-slate-200
          bg-slate-50 p-4
          sm:p-5
        "
      >
        {filteredUsers.length >
          0 ? (
          filteredUsers.map(
            (user) => (
              <UserRow
                key={user.id}
                user={user}
                isAdmin={isAdmin}
                canManageUsers={
                  canManageUsers
                }
                canChangeRoles={
                  canChangeRoles
                }
                onRoleChange={
                  handleRoleChange
                }
                onUpdateUser={
                  handleUpdateUser
                }
                onDeleteUser={
                  handleDeleteUser
                }
                onAssignHead={
                  handleAssignHead
                }
                onRemoveHead={
                  handleRemoveHead
                }
                availableRoles={
                  roleOptions
                }
              />
            )
          )
        ) : (
          <div
            className="
              flex min-h-[220px]
              flex-col items-center
              justify-center
              rounded-2xl
              border border-dashed
              border-slate-300
              bg-white p-8
              text-center
            "
          >
            <UserRound
              className="
                h-9 w-9
                text-slate-300
              "
            />

            <h2
              className="
                mt-3 font-black
                text-slate-900
              "
            >
              Пользователи не найдены
            </h2>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Измените параметры фильтра.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};
