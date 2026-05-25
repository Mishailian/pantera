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
  useDeclaredPostMutation,
  useChangeRequestStatusMutation,
} from "../app/api/apiSlice";
import { ActivePostBlock } from "../auxComponents/ActivePostBlock";

const TAB_CONFIG = {
  store: { key: "store", label: "Созданные заявки", path: "/store", status: "active" },
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
  const [declarePost] = useDeclaredPostMutation();

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchTerm.trim()) {
      const value = searchTerm.toLowerCase();

      result = result.filter((post) => {
        const createdByPhone = (post?.created_by_user?.number || post?.createdbyuser?.number || "").toLowerCase();
        const createdByFullName = (post?.created_by_user?.full_name || post?.created_by_user?.fullname || post?.createdbyuser?.full_name || "").toLowerCase();
        const requestId = String(post?.id || "").toLowerCase();

        const itemAssignees = (post?.items || []).map((item) => item?.assigned_to_user).filter(Boolean);
        const assignedPhones = itemAssignees.map((u) => (u.number || "").toLowerCase());
        const assignedNames = itemAssignees.map((u) => (u.full_name || "").toLowerCase());

        switch (searchField) {
          case "created_by":
            return createdByPhone.includes(value) || createdByFullName.includes(value);
          case "assigned_to":
            return assignedPhones.some((p) => p.includes(value)) || assignedNames.some((n) => n.includes(value));
          case "request_id":
            return requestId.includes(value);
          default:
            return (
              createdByPhone.includes(value) ||
              createdByFullName.includes(value) ||
              assignedPhones.some((p) => p.includes(value)) ||
              requestId.includes(value)
            );
        }
      });
    }

    result.sort((a, b) => {
      const aId = Number(a?.id) || 0;
      const bId = Number(b?.id) || 0;
  
      // Если sortOrder === "oldest", то сначала идут заявки с меньшим ID (старые)
      // Если "newest", то сначала идут заявки с большим ID (новые)
      return sortOrder === "oldest" ? aId - bId : bId - aId;
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
  
  const handleSign = async (requestId) => {
    try {
      await declarePost({
        postId: requestId,
        changed_by_id: currentUserId,
        comment: "Заявка переведена в активные из списка",
      }).unwrap();
    } catch (error) {
      console.error(error);
      alert("Не удалось подписать заявку.");
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
      {/* ГЛАВНАЯ КАРТОЧКА С ВКЛАДКАМИ И ФИЛЬТРАМИ */}
      <div className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* МАССИВНЫЕ ВКЛАДКИ НА ВСЮ ШИРИНУ */}
        <div className="flex flex-col sm:flex-row w-full border-b border-slate-200 bg-slate-100">
          {Object.values(TAB_CONFIG).map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => navigate(tabItem.path)}
              className={`relative flex-1 px-4 py-5 sm:py-6 text-base sm:text-lg font-extrabold uppercase tracking-widest outline-none transition-colors border-b sm:border-b-0 sm:border-r border-slate-200 last:border-0 ${
                tabItem.key === activeTab.key
                  ? "bg-white text-slate-900 shadow-[inset_0_3px_0_0_#0f172a]" // Активная: белый фон, черная полоска сверху
                  : "bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-800" // Неактивная: серая, темнеет при наведении
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* ВНУТРЕННИЙ КОНТЕНТ (ЗАГОЛОВОК И ПОИСК) */}
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              {activeTab.label}
            </h2>
            <p className="mt-2 text-xl font-medium text-slate-500">
              {filteredPosts.length} из {countValue} заявок
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
            >
              <option value="created_by">Создатель</option>
              <option value="assigned_to">Ответственный от снабжения</option>
              <option value="request_id">Номер заявки</option>
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по выбранному полю..."
              className="h-14 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base shadow-sm transition hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
            />

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </div>
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
                Ответственный
                <br />
                от снабжения
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
                onSign={handleSign}
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