import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetActiveRequestsQuery,
  useGetPostsCountQuery,
  useDeleteRequestMutation,
  useChangeRequestStatusMutation,
} from "../../app/api/apiSlice";
import { ActivePostBlock } from "../../auxComponents/ActivePostBlock";

export const PostsList = () => {
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const currentUserId = useSelector((state) => state.auth.username_id);

  const canManage = currentUserRoles.some((role) =>
    ["admin", "supply_manager"].includes(role?.name)
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("created_by");
  const [sortOrder, setSortOrder] = useState("newest");

  const { data: posts = [], isLoading, isError } = useGetActiveRequestsQuery();
  const { data: countData } = useGetPostsCountQuery();

  const [archiveRequest] = useChangeRequestStatusMutation();
  const [deleteRequest] = useDeleteRequestMutation();

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchTerm.trim()) {
      const value = searchTerm.toLowerCase();

      result = result.filter((post) => {
        const createdByUsername = post?.created_by_user?.username?.toLowerCase() || "";
        const createdByFullName = post?.created_by_user?.full_name?.toLowerCase() || "";
        const assignedToUsername = post?.assigned_to_user?.username?.toLowerCase() || "";
        const assignedToFullName = post?.assigned_to_user?.full_name?.toLowerCase() || "";
        const approvedByUsername = post?.approved_by_user?.username?.toLowerCase() || "";
        const approvedByFullName = post?.approved_by_user?.full_name?.toLowerCase() || "";
        const comment = post?.comment?.toLowerCase() || "";
        const requestId = String(post?.id || "").toLowerCase();

        switch (searchField) {
          case "created_by":
            return (
              createdByUsername.includes(value) ||
              createdByFullName.includes(value)
            );

          case "assigned_to":
            return (
              assignedToUsername.includes(value) ||
              assignedToFullName.includes(value)
            );

          case "approved_by":
            return (
              approvedByUsername.includes(value) ||
              approvedByFullName.includes(value)
            );

          case "comment":
            return comment.includes(value);

          case "request_id":
            return requestId.includes(value);

          default:
            return (
              createdByUsername.includes(value) ||
              createdByFullName.includes(value) ||
              assignedToUsername.includes(value) ||
              assignedToFullName.includes(value) ||
              approvedByUsername.includes(value) ||
              approvedByFullName.includes(value) ||
              comment.includes(value) ||
              requestId.includes(value)
            );
        }
      });
    }

    result.sort((a, b) => {
      const aTime = new Date(a?.created_at || 0).getTime();
      const bTime = new Date(b?.created_at || 0).getTime();

      if (sortOrder === "oldest") {
        return aTime - bTime;
      }

      return bTime - aTime;
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
      console.error("Failed to archive request:", error);
      alert("Не удалось отправить заявку в архив.");
    }
  };

  const handleDelete = async (requestId) => {
    if (!confirm("Удалить активную заявку?")) return;

    try {
      await deleteRequest(requestId).unwrap();
    } catch (error) {
      console.error("Failed to delete request:", error);
      alert("Не удалось удалить заявку.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-[1800px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Загрузка активных заявок...
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-[1800px]">
          <div className="rounded-3xl border border-rose-200 bg-white p-12 text-center text-rose-500">
            Не удалось загрузить активные заявки
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] xl:items-end">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                Активные заявки
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {filteredPosts.length} из {countData?.count || posts.length} заявок
              </p>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)_190px] xl:grid-cols-[200px_minmax(0,1fr)_210px]">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="created_by">Создатель</option>
                  <option value="assigned_to">Назначенный пользователь</option>
                  <option value="approved_by">Подписавший</option>
                  <option value="comment">Комментарий</option>
                  <option value="request_id">Номер заявки</option>
                </select>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск по выбранному полю..."
                  className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="newest">Сначала новые</option>
                  <option value="oldest">Сначала старые</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
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
              <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
              <h3 className="mb-2 text-xl font-semibold text-slate-800">
                Активные заявки не найдены
              </h3>
              <p className="text-slate-500">
                {searchTerm
                  ? "Попробуйте изменить параметры поиска"
                  : "Сейчас нет активных заявок"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
