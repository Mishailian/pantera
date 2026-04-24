import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetActiveRequestsQuery,
  useGetUndeclaredRequestsQuery,
  useGetArchivedRequestsQuery,
  useGetPostsCountQuery,
  useGetUndeclaredPostsCountQuery,
  useGetArhiveQuery,
  useDeleteRequestMutation,
  useChangeRequestStatusMutation,
} from "../app/api/apiSlice";
import { ActivePostBlock } from "../auxComponents/ActivePostBlock";

const TAB_CONFIG = {
  store: { key: "store", label: "Заявки", path: "/store", status: "active" },
  undeclared: { key: "undeclared", label: "Без подписи", path: "/undeclared", status: "undeclared" },
  archived: { key: "archived", label: "Архив", path: "/archived", status: "archived" },
};

export const RequestsTabsPage = ({ tab = "store" }) => {
  const navigate = useNavigate();
  const activeTab = TAB_CONFIG[tab] || TAB_CONFIG.store;

  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const currentUserId = useSelector((state) => state.auth.username_id);

  const canManage = currentUserRoles.some((role) =>
    ["admin", "supply_manager"].includes(role?.name)
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("created_by");
  const [sortOrder, setSortOrder] = useState("newest");

  const activeQuery = useGetActiveRequestsQuery(undefined, {
    skip: activeTab.status !== "active",
  });
  const undeclaredQuery = useGetUndeclaredRequestsQuery(undefined, {
    skip: activeTab.status !== "undeclared",
  });
  const archivedQuery = useGetArchivedRequestsQuery(undefined, {
    skip: activeTab.status !== "archived",
  });

  const countActiveQuery = useGetPostsCountQuery(undefined, {
    skip: activeTab.status !== "active",
  });
  const countUndeclaredQuery = useGetUndeclaredPostsCountQuery(undefined, {
    skip: activeTab.status !== "undeclared",
  });
  const countArchivedQuery = useGetArhiveQuery(undefined, {
    skip: activeTab.status !== "archived",
  });

  const { data: posts = [], isLoading, isError } =
    activeTab.status === "active"
      ? activeQuery
      : activeTab.status === "undeclared"
      ? undeclaredQuery
      : archivedQuery;

  const { data: countData } =
    activeTab.status === "active"
      ? countActiveQuery
      : activeTab.status === "undeclared"
      ? countUndeclaredQuery
      : countArchivedQuery;

  const [archiveRequest] = useChangeRequestStatusMutation();
  const [deleteRequest] = useDeleteRequestMutation();

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchTerm.trim()) {
      const value = searchTerm.toLowerCase();

      result = result.filter((post) => {
        const createdByUsername =
          post?.created_by_user?.username?.toLowerCase() ||
          post?.createdbyuser?.username?.toLowerCase() ||
          "";

        const createdByFullName =
          post?.created_by_user?.full_name?.toLowerCase() ||
          post?.created_by_user?.fullname?.toLowerCase() ||
          post?.createdbyuser?.full_name?.toLowerCase() ||
          post?.createdbyuser?.fullname?.toLowerCase() ||
          "";

        const assignedToUsername =
          post?.assigned_to_user?.username?.toLowerCase() ||
          post?.assignedtouser?.username?.toLowerCase() ||
          "";

        const assignedToFullName =
          post?.assigned_to_user?.full_name?.toLowerCase() ||
          post?.assigned_to_user?.fullname?.toLowerCase() ||
          post?.assignedtouser?.full_name?.toLowerCase() ||
          post?.assignedtouser?.fullname?.toLowerCase() ||
          "";

        const requestId = String(post?.id || "").toLowerCase();

        switch (searchField) {
          case "created_by":
            return createdByUsername.includes(value) || createdByFullName.includes(value);
          case "assigned_to":
            return assignedToUsername.includes(value) || assignedToFullName.includes(value);
          case "request_id":
            return requestId.includes(value);
          default:
            return (
              createdByUsername.includes(value) ||
              createdByFullName.includes(value) ||
              assignedToUsername.includes(value) ||
              assignedToFullName.includes(value) ||
              requestId.includes(value)
            );
        }
      });
    }

    result.sort((a, b) => {
      const aTime = new Date(a?.created_at || a?.createdat || 0).getTime();
      const bTime = new Date(b?.created_at || b?.createdat || 0).getTime();
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return result;
  }, [posts, searchTerm, searchField, sortOrder]);

  const handleArchive = async (requestId) => {
    try {
      await archiveRequest({
        requestId,
        status: "archived",
        changed_by_id: currentUserId,
        comment: "Заявка переведена в архив",
      }).unwrap();
    } catch (error) {
      console.error(error);
      alert("Не удалось отправить заявку в архив.");
    }
  };

  const handleDelete = async (requestId) => {
    if (!confirm("Удалить заявку?")) return;

    try {
      await deleteRequest(requestId).unwrap();
    } catch (error) {
      console.error(error);
      alert("Не удалось удалить заявку.");
    }
  };

  const countValue =
    countData?.count ??
    (Array.isArray(countData) ? countData.length : null) ??
    posts.length;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Загрузка заявок...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-rose-500">
        Не удалось загрузить заявки
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">
              {activeTab.label}
            </h2>
            <p className="mt-2 text-lg text-slate-600">
              {filteredPosts.length} из {countValue} заявок
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
            {Object.values(TAB_CONFIG).map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => navigate(tabItem.path)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tabItem.key === activeTab.key
                    ? "bg-black text-white"
                    : "bg-transparent text-slate-700 hover:bg-white"
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
          >
            <option value="created_by">Создатель</option>
            <option value="assigned_to">Назначенный пользователь</option>
            <option value="request_id">Номер заявки</option>
          </select>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по выбранному полю..."
            className="h-12 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
          />

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        {filteredPosts.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="hidden grid-cols-[40px_90px_90px_150px_90px_210px_170px] gap-3 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 xl:grid">
              <div>№</div>
              <div>Дата создания</div>
              <div>Статус</div>
              <div>Создатель</div>
              <div>Позиций</div>
              <div>
                Назначенный
                <br />
                пользователь
              </div>
              <div>Действия</div>
            </div>

            {filteredPosts.map((post) => (
              <ActivePostBlock
                key={post.id}
                data={post}
                canManage={canManage}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <h3 className="mb-2 text-xl font-semibold text-slate-800">
              Заявки не найдены
            </h3>
            <p className="text-slate-500">
              {searchTerm ? "Попробуйте изменить параметры поиска" : "Сейчас здесь нет заявок"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};