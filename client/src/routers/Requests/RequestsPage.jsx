import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useSelector } from "react-redux";

import {
  Archive,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileSearch,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

import {
  useChangeRequestStatusMutation,
  useDeclaredPostMutation,
  useDeleteRequestMutation,
  useGetActiveRequestsQuery,
  useGetArchivedRequestsQuery,
  useGetCurrentUserQuery,
  useGetUndeclaredRequestsQuery,
  useGetUsersQuery,
} from "../../app/api/apiSlice";

import {
  ActivePostBlock,
} from "../../auxComponents/ActivePostBlock";

import {
  Pagination,
} from "./Pagination";


const REQUEST_PAGE_CONFIG = {
  active: {
    title: "Подписанные заявки",
    description: "Заявки, принятые в работу",
    path: "/store",
    label: "Активные",
    accent: "blue",
    icon: CheckCircle2,
  },

  undeclared: {
    title: "Заявки без подписи",
    description:
      "Заявки, ожидающие проверки и подписания",
    path: "/undeclared",
    label: "Ожидают подписи",
    accent: "amber",
    icon: Clock3,
  },

  archived: {
    title: "Завершённые заявки",
    description:
      "История выполненных и закрытых заявок",
    path: "/archived",
    label: "Архив",
    accent: "emerald",
    icon: Archive,
  },
};


const ACCENT_STYLES = {
  blue: {
    badge:
      "border-blue-200 bg-blue-50 text-blue-700",
    dot:
      "bg-blue-500",
    icon:
      "border-blue-100 bg-blue-50 text-blue-600",
    tab:
      "bg-blue-600 text-white shadow-sm",
  },

  amber: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
    dot:
      "bg-amber-500",
    icon:
      "border-amber-100 bg-amber-50 text-amber-600",
    tab:
      "bg-amber-500 text-white shadow-sm",
  },

  emerald: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot:
      "bg-emerald-500",
    icon:
      "border-emerald-100 bg-emerald-50 text-emerald-600",
    tab:
      "bg-emerald-600 text-white shadow-sm",
  },
};


const SUPPLY_ROLES = new Set([
  "supply_manager",
  "supply_head",
]);


const normalizeRoleName = (role) => {
  if (typeof role === "string") {
    return role;
  }

  return role?.name || null;
};


const getUserRoleNames = (user) => {
  const roles = [];

  if (typeof user?.role === "string") {
    roles.push(user.role);
  } else if (user?.role?.name) {
    roles.push(user.role.name);
  }

  if (Array.isArray(user?.roles)) {
    for (const role of user.roles) {
      const roleName = normalizeRoleName(role);

      if (roleName) {
        roles.push(roleName);
      }
    }
  }

  return [...new Set(roles)];
};


const isSupplyUser = (user) => {
  const roleNames =
    getUserRoleNames(user);

  return roleNames.some(
    (roleName) =>
      SUPPLY_ROLES.has(roleName)
  );
};


const SelectField = ({
  label,
  value,
  onChange,
  children,
  icon: Icon,
}) => {
  return (
    <label className="relative block min-w-0">
      <span
        className="
          pointer-events-none absolute
          left-4 top-2.5 z-10
          text-[10px] font-black uppercase
          tracking-[0.12em] text-slate-400
        "
      >
        {label}
      </span>

      {Icon ? (
        <Icon
          className="
            pointer-events-none absolute
            right-11 top-1/2 h-4 w-4
            -translate-y-1/2 text-slate-400
          "
        />
      ) : null}

      <select
        value={value}
        onChange={onChange}
        className="
          h-[58px] w-full appearance-none
          truncate rounded-xl
          border border-slate-200 bg-white
          px-4 pb-1 pt-5 pr-16
          text-sm font-bold text-slate-800
          outline-none transition
          hover:border-slate-300
          focus:border-blue-400
          focus:ring-4 focus:ring-blue-100
        "
      >
        {children}
      </select>

      <ChevronDown
        className="
          pointer-events-none absolute
          right-4 top-1/2 h-4 w-4
          -translate-y-1/2 text-slate-400
        "
      />
    </label>
  );
};


export const RequestsPage = ({
  status,
}) => {
  const navigate = useNavigate();

  const {
    page: pageParam,
  } = useParams();

  const currentUserRoles =
    useSelector(
      (state) =>
        state.auth.roles || []
    );

  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
  } = useGetCurrentUserQuery();

  const {
    data: usersData = [],
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useGetUsersQuery();

  const currentUserId =
    currentUser?.id ?? null;

  const pageConfig =
    REQUEST_PAGE_CONFIG[status] ||
    REQUEST_PAGE_CONFIG.active;

  const accent =
    ACCENT_STYLES[
    pageConfig.accent
    ];

  const PageIcon =
    pageConfig.icon;

  const parsedPage =
    Number.parseInt(
      pageParam,
      10
    );

  const pageNumber =
    Number.isInteger(parsedPage) &&
      parsedPage > 0
      ? parsedPage
      : 1;

  const apiPage =
    pageNumber;

  const roleNames =
    useMemo(
      () =>
        currentUserRoles
          .map(
            normalizeRoleName
          )
          .filter(Boolean),
      [currentUserRoles]
    );

  const isAdmin =
    roleNames.includes(
      "admin"
    );

  const canManage =
    roleNames.some(
      (roleName) =>
        [
          "admin",
          "supply_manager",
          "supply_head",
          "rezo_department",
          "rezo_head",
        ].includes(roleName)
    );

  const [
    assigneeFilter,
    setAssigneeFilter,
  ] = useState("all");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    searchField,
    setSearchField,
  ] = useState(
    "created_by"
  );

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    "newest"
  );

  const supplyUsers =
    useMemo(() => {
      const users =
        Array.isArray(usersData)
          ? usersData
          : usersData?.items || [];

      return users
        .filter(isSupplyUser)
        .sort(
          (
            firstUser,
            secondUser
          ) =>
            String(
              firstUser?.full_name ||
              ""
            ).localeCompare(
              String(
                secondUser?.full_name ||
                ""
              ),
              "ru"
            )
        );
    }, [usersData]);

  const selectedAssigneeId =
    useMemo(() => {
      if (
        assigneeFilter === "all"
      ) {
        return undefined;
      }

      if (
        assigneeFilter === "mine"
      ) {
        return (
          currentUserId ??
          undefined
        );
      }

      const parsedUserId =
        Number.parseInt(
          assigneeFilter,
          10
        );

      return Number.isInteger(
        parsedUserId
      )
        ? parsedUserId
        : undefined;
    }, [
      assigneeFilter,
      currentUserId,
    ]);

  const selectedAssigneeLabel =
    useMemo(() => {
      if (
        assigneeFilter === "all"
      ) {
        return (
          "Все ответственные"
        );
      }

      if (
        assigneeFilter === "mine"
      ) {
        return (
          currentUser?.full_name
            ? `Только мои: ${currentUser.full_name}`
            : "Только мои заявки"
        );
      }

      const selectedUser =
        supplyUsers.find(
          (user) =>
            String(user.id) ===
            String(
              assigneeFilter
            )
        );

      return (
        selectedUser?.full_name ||
        "Выбранный ответственный"
      );
    }, [
      assigneeFilter,
      currentUser?.full_name,
      supplyUsers,
    ]);

  const serverSort =
    sortOrder === "oldest"
      ? "asc"
      : "desc";

  const queryArguments = {
    page: apiPage,
    per_page: 15,
    sort: serverSort,

    department:
      "supply",

    assigned_to_id:
      selectedAssigneeId,

    search:
      searchTerm.trim() ||
      undefined,

    search_field:
      searchTerm.trim()
        ? searchField
        : undefined,
  };

  const activeQuery =
    useGetActiveRequestsQuery(
      queryArguments,
      {
        skip:
          status !== "active",
      }
    );

  const undeclaredQuery =
    useGetUndeclaredRequestsQuery(
      queryArguments,
      {
        skip:
          status !==
          "undeclared",
      }
    );

  const archivedQuery =
    useGetArchivedRequestsQuery(
      queryArguments,
      {
        skip:
          status !==
          "archived",
      }
    );

  const currentQuery =
    status === "active"
      ? activeQuery
      : status === "undeclared"
        ? undeclaredQuery
        : archivedQuery;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = currentQuery;

  const posts =
    data?.items ?? [];

  const total =
    data?.total ?? 0;

  const totalPages =
    Math.max(
      data?.pages ??
      Math.ceil(
        total /
        (
          data?.per_page ||
          15
        )
      ),
      1
    );

  const [archiveRequest] =
    useChangeRequestStatusMutation();

  const [deleteRequest] =
    useDeleteRequestMutation();

  const [declarePost] =
    useDeclaredPostMutation();

  useEffect(() => {
    const isValidPage =
      Number.isInteger(
        parsedPage
      ) &&
      parsedPage > 0;

    if (!isValidPage) {
      navigate(
        `${pageConfig.path}/page/1`,
        {
          replace: true,
        }
      );
    }
  }, [
    parsedPage,
    navigate,
    pageConfig.path,
  ]);

  useEffect(() => {
    if (
      !isLoading &&
      !isFetching &&
      total > 0 &&
      pageNumber >
      totalPages
    ) {
      navigate(
        `${pageConfig.path}/page/${totalPages}`,
        {
          replace: true,
        }
      );
    }
  }, [
    isLoading,
    isFetching,
    total,
    pageNumber,
    totalPages,
    navigate,
    pageConfig.path,
  ]);

  const goToPage = (
    nextPage
  ) => {
    const safePage =
      Math.min(
        Math.max(
          nextPage,
          1
        ),
        totalPages
      );

    navigate(
      `${pageConfig.path}/page/${safePage}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToFirstPage =
    () => {
      if (
        pageNumber !== 1
      ) {
        navigate(
          `${pageConfig.path}/page/1`
        );
      }
    };

  const handleAssigneeChange = (
    event
  ) => {
    setAssigneeFilter(
      event.target.value
    );

    goToFirstPage();
  };

  const handleSearchChange = (
    event
  ) => {
    setSearchTerm(
      event.target.value
    );

    goToFirstPage();
  };

  const handleArchive =
    async (requestId) => {
      try {
        await archiveRequest({
          requestId,
          status: "archived",
          changed_by_id:
            currentUserId,
          comment:
            "Заявка переведена в архив",
        }).unwrap();
      } catch (
      archiveError
      ) {
        alert(
          archiveError
            ?.data
            ?.error ||
          "Не удалось завершить заявку."
        );
      }
    };

  const handleDelete =
    async (requestId) => {
      const reason =
        window.prompt(
          "Укажите причину удаления или оставьте поле пустым:"
        );

      if (
        reason === null
      ) {
        return;
      }

      try {
        await deleteRequest({
          requestId,
          deletedById:
            currentUserId,
          reason:
            reason.trim() ||
            null,
        }).unwrap();
      } catch (
      deleteError
      ) {
        alert(
          deleteError
            ?.data
            ?.error ||
          "Не удалось удалить заявку."
        );
      }
    };

  const handleSign =
    async (requestId) => {
      try {
        await declarePost({
          postId:
            requestId,
          changed_by_id:
            currentUserId,
          comment:
            "Заявка переведена в активные",
        }).unwrap();
      } catch (
      signError
      ) {
        alert(
          signError
            ?.data
            ?.error ||
          "Не удалось подписать заявку."
        );
      }
    };

  if (
    isLoading ||
    isCurrentUserLoading
  ) {
    return (
      <div
        className="
          flex min-h-[420px]
          min-w-full items-center
          justify-center rounded-2xl
          border border-slate-200
          bg-white
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto h-9 w-9
              animate-spin rounded-full
              border-4 border-slate-200
              border-t-blue-600
            "
          />

          <p className="mt-4 text-sm font-bold text-slate-500">
            Загружаем заявки...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="
          min-w-full rounded-2xl
          border border-rose-200
          bg-white p-10 text-center
          shadow-sm
        "
      >
        <h2 className="text-xl font-black text-rose-600">
          Не удалось загрузить заявки
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error?.data?.error ||
            "Произошла ошибка при получении данных."}
        </p>
      </div>
    );
  }

  return (
    <main className="min-w-full space-y-5">
      <section
        className="
          min-w-full overflow-hidden
          rounded-2xl border
          border-slate-200 bg-white
          shadow-sm
        "
      >
        <nav
          className="
            grid grid-cols-1 gap-2
            border-b border-slate-200
            bg-slate-50 p-3
            sm:grid-cols-3
          "
        >
          <button
            type="button"
            onClick={() =>
              navigate(
                "/store/page/1"
              )
            }
            className={`
              flex h-12 items-center
              justify-center rounded-xl
              px-4 text-sm font-black
              transition
              ${status === "active"
                ? ACCENT_STYLES.blue.tab
                : "text-slate-500 hover:bg-white hover:text-slate-900"
              }
            `}
          >
            Подписанные
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/undeclared/page/1"
              )
            }
            className={`
              flex h-12 items-center
              justify-center rounded-xl
              px-4 text-sm font-black
              transition
              ${status === "undeclared"
                ? ACCENT_STYLES.amber.tab
                : "text-slate-500 hover:bg-white hover:text-slate-900"
              }
            `}
          >
            Без подписи
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/archived/page/1"
              )
            }
            className={`
              flex h-12 items-center
              justify-center rounded-xl
              px-4 text-sm font-black
              transition
              ${status === "archived"
                ? ACCENT_STYLES.emerald.tab
                : "text-slate-500 hover:bg-white hover:text-slate-900"
              }
            `}
          >
            Завершённые
          </button>
        </nav>

        <div
          className="
            flex flex-col gap-6
            px-5 py-6 sm:px-7
            lg:flex-row lg:items-center
            lg:justify-between
          "
        >
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-xl border
                ${accent.icon}
              `}
            >
              <PageIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`
                    inline-flex items-center
                    rounded-full border
                    px-3 py-1 text-[11px]
                    font-black uppercase
                    tracking-[0.1em]
                    ${accent.badge}
                  `}
                >
                  <span
                    className={`
                      mr-2 h-2 w-2 rounded-full
                      ${accent.dot}
                    `}
                  />

                  {pageConfig.label}
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
                  Страница{" "}
                  {pageNumber} из{" "}
                  {totalPages}
                </span>

                <span
                  className="
                    inline-flex items-center
                    gap-1.5 rounded-full
                    border border-violet-200
                    bg-violet-50 px-3 py-1
                    text-xs font-bold
                    text-violet-700
                  "
                >
                  <UsersRound className="h-3.5 w-3.5" />

                  {selectedAssigneeLabel}
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
                {pageConfig.title}
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {pageConfig.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            <div
              className="
                min-w-[110px] rounded-xl
                border border-slate-200
                bg-slate-50 px-4 py-3
              "
            >
              <div
                className="
                  text-[10px] font-black
                  uppercase tracking-[0.12em]
                  text-slate-400
                "
              >
                Всего
              </div>

              <div className="mt-1 text-2xl font-black text-slate-950">
                {total}
              </div>
            </div>

            <div
              className="
                min-w-[110px] rounded-xl
                border border-slate-200
                bg-slate-50 px-4 py-3
              "
            >
              <div
                className="
                  text-[10px] font-black
                  uppercase tracking-[0.12em]
                  text-slate-400
                "
              >
                На странице
              </div>

              <div className="mt-1 text-2xl font-black text-slate-950">
                {posts.length}
              </div>
            </div>
          </div>
        </div>

        <div
          className="
            border-t border-slate-100
            bg-slate-50/70 p-4
            sm:p-5
          "
        >
          <div
            className="
              grid grid-cols-1 gap-3
              xl:grid-cols-[270px_210px_minmax(260px,1fr)_210px]
            "
          >
            <SelectField
              label="Ответственный"
              value={assigneeFilter}
              onChange={
                handleAssigneeChange
              }
              icon={UsersRound}
            >
              <option value="all">
                Все ответственные
              </option>

              <option value="mine">
                Только мои заявки
              </option>

              {isUsersLoading ? (
                <option disabled>
                  Загрузка работников...
                </option>
              ) : null}

              {isUsersError ? (
                <option disabled>
                  Не удалось загрузить работников
                </option>
              ) : null}

              {supplyUsers
                .filter(
                  (user) =>
                    String(user.id) !==
                    String(
                      currentUserId
                    )
                )
                .map((user) => (
                  <option
                    key={user.id}
                    value={String(
                      user.id
                    )}
                  >
                    {user.full_name ||
                      "Без имени"}
                    {user.number
                      ? ` — ${user.number}`
                      : ""}
                  </option>
                ))}
            </SelectField>

            <SelectField
              label="Искать по"
              value={searchField}
              onChange={(event) => {
                setSearchField(
                  event.target.value
                );

                goToFirstPage();
              }}
            >
              <option value="created_by">
                Создателю
              </option>

              <option value="assigned_to">
                Ответственному
              </option>

              <option value="request_id">
                Номеру заявки
              </option>
            </SelectField>

            <label className="relative block min-w-0">
              <span
                className="
                  pointer-events-none absolute
                  left-4 top-2.5 z-10
                  text-[10px] font-black
                  uppercase tracking-[0.12em]
                  text-slate-400
                "
              >
                Поиск
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={
                  handleSearchChange
                }
                placeholder="Введите имя, телефон или номер заявки"
                className="
                  h-[58px] w-full
                  rounded-xl border
                  border-slate-200 bg-white
                  px-4 pb-1 pt-5 pr-12
                  text-sm font-semibold
                  text-slate-900 outline-none
                  transition
                  placeholder:text-slate-400
                  hover:border-slate-300
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

              <Search
                className="
                  pointer-events-none absolute
                  right-4 top-1/2 h-5 w-5
                  -translate-y-1/2
                  text-slate-400
                "
              />
            </label>

            <SelectField
              label="Сортировка"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(
                  event.target.value
                );

                goToFirstPage();
              }}
            >
              <option value="newest">
                Сначала новые
              </option>

              <option value="oldest">
                Сначала старые
              </option>
            </SelectField>
          </div>
        </div>
      </section>

      <section
        className="
          min-w-full overflow-hidden
          rounded-2xl border
          border-slate-200 bg-white
          shadow-sm
        "
      >
        <header
          className="
            flex min-h-[74px]
            items-center justify-between
            gap-4 border-b
            border-slate-100
            px-5 sm:px-6
          "
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-slate-400" />

            <div>
              <h2 className="font-black text-slate-900">
                Список заявок
              </h2>

              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Показано записей:{" "}
                {posts.length}
              </p>
            </div>
          </div>

          {isFetching ? (
            <div
              className="
                inline-flex items-center
                gap-2 rounded-full
                bg-blue-50 px-3 py-2
                text-xs font-black
                text-blue-700
              "
            >
              <span
                className="
                  h-2 w-2 animate-pulse
                  rounded-full bg-blue-600
                "
              />

              Обновление
            </div>
          ) : null}
        </header>

        {posts.length > 0 ? (
          <div className="min-w-full overflow-x-auto">
            <div className="min-w-[1180px] p-4 sm:p-5">
              <div
                className="
                  mb-2 grid items-center
                  gap-4 rounded-xl
                  bg-slate-50 px-5 py-3
                  text-[10px] font-black
                  uppercase tracking-[0.12em]
                  text-slate-400
                  xl:grid-cols-[40px_90px_90px_160px_80px_190px_170px]
                  xl:gap-3
                "
              >
                <div>№</div>
                <div>Дата</div>
                <div>Статус</div>
                <div>Создатель</div>
                <div>Позиций</div>
                <div>Ответственный</div>
                <div className="text-right">
                  Действия
                </div>
              </div>

              <div className="space-y-2">
                {posts.map(
                  (post) => (
                    <ActivePostBlock
                      key={post.id}
                      data={post}
                      canManage={
                        canManage
                      }
                      canDelete={
                        isAdmin
                      }
                      onArchive={
                        handleArchive
                      }
                      onDelete={
                        handleDelete
                      }
                      onSign={
                        handleSign
                      }
                    />
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="
              flex min-h-[320px]
              flex-col items-center
              justify-center px-6
              py-14 text-center
            "
          >
            <div
              className="
                flex h-14 w-14
                items-center justify-center
                rounded-2xl bg-slate-100
                text-slate-400
              "
            >
              <FileSearch className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-900">
              Заявки не найдены
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {searchTerm.trim()
                ? "По заданным параметрам ничего не найдено."
                : "У выбранного ответственного нет заявок в этом разделе."}
            </p>

            {searchTerm.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  goToFirstPage();
                }}
                className="
                  mt-5 rounded-xl
                  bg-slate-900 px-5
                  py-2.5 text-sm
                  font-black text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Сбросить поиск
              </button>
            ) : null}
          </div>
        )}

        {totalPages > 1 ? (
          <footer
            className="
              border-t border-slate-100
              px-5 py-4 sm:px-6
            "
          >
            <Pagination
              page={pageNumber}
              totalPages={totalPages}
              onPageChange={
                goToPage
              }
            />
          </footer>
        ) : null}
      </section>
    </main>
  );
};
