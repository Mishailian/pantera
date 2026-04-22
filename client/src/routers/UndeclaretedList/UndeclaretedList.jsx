import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetUndeclaredPostsQuery,
  useGetUndeclaredPostsCountQuery,
  useDeleteUndeclaredPostMutation,
  useDeclaredPostMutation,
} from "../../app/api/apiSlice";
import { UndeclaretedPostBlock } from "../../auxComponents/UndeclaretedPostBlock";

export const UndeclaretedList = () => {
  const currentUserRoles = useSelector((state) => state.auth.roles || []);
  const currentUserId = useSelector((state) => state.auth.username_id);

  const isAdmin = currentUserRoles.some((role) =>
    ["admin", "supply_manager"].includes(role?.name)
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const { data: posts = [], isLoading, isError } = useGetUndeclaredPostsQuery();
  const { data: countData } = useGetUndeclaredPostsCountQuery();
  const [declarePost] = useDeclaredPostMutation();
  const [deletePost] = useDeleteUndeclaredPostMutation();

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchTerm.trim()) {
      const value = searchTerm.toLowerCase();

      result = result.filter((post) => {
        const username = post?.created_by_user?.username?.toLowerCase() || "";
        const fullName = post?.created_by_user?.full_name?.toLowerCase() || "";
        const comment = post?.comment?.toLowerCase() || "";
        const requestId = String(post?.id || "");

        return (
          username.includes(value) ||
          fullName.includes(value) ||
          comment.includes(value) ||
          requestId.includes(value)
        );
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
  }, [posts, searchTerm, sortOrder]);

  const handleDeclare = async (postId) => {
    try {
      await declarePost({
        postId,
        changed_by_id: currentUserId,
        comment: "Заявка переведена в active",
      }).unwrap();
    } catch (error) {
      console.error("Failed to declare post:", error);
      alert("Не удалось подписать заявку.");
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Удалить неподписанную заявку?")) return;

    try {
      await deletePost(postId).unwrap();
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Не удалось удалить заявку.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-[1800px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Загрузка неподписанных заявок...
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
            Не удалось загрузить неподписанные заявки
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                Заявки без подписи
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {filteredPosts.length} из {countData?.count || posts.length} заявок
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по номеру, логину, имени, комментарию..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 md:w-96"
              />

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              {filteredPosts.map((post) => (
                <UndeclaretedPostBlock
                  key={post.id}
                  data={post}
                  isAdmin={isAdmin}
                  onDeclare={handleDeclare}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
              <h3 className="mb-2 text-xl font-semibold text-slate-800">
                Заявки без подписи не найдены
              </h3>
              <p className="text-slate-500">
                {searchTerm
                  ? "Попробуйте изменить фильтр поиска"
                  : "Все заявки подписаны или находятся на других этапах"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};