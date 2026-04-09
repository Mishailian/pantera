import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetArchivedRequestsQuery } from "../../app/api/apiSlice";


const ArchiveRequestCard = ({ data }) => {
  const navigate = useNavigate();


  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-6">
        <div className="mb-3 inline-flex rounded-xl bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          Архив • № {data?.id}
        </div>


        <h3 className="text-lg font-bold text-slate-900">
          @{data?.created_by_user?.username || "unknown"}
        </h3>


        <p className="mt-1 text-sm text-slate-500">
          {data?.created_by_user?.full_name || "Неизвестный пользователь"}
        </p>
      </div>


      <div className="space-y-4 p-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">Комментарий</p>
          <p className="mt-1 text-sm text-slate-700">
            {data?.comment?.trim() || "Комментарий отсутствует"}
          </p>
        </div>


        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Создана</p>
            <p className="mt-1 font-medium text-slate-800">
              {data?.created_at_formatted || "—"}
            </p>
          </div>


          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Архивирована</p>
            <p className="mt-1 font-medium text-slate-800">
              {data?.archived_at_formatted || data?.closed_at_formatted || "—"}
            </p>
          </div>
        </div>


        {data?.archived_by_user && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Кто архивировал</p>
            <div className="mt-1 space-y-1">
              <p className="font-medium text-slate-800">
                {data.archived_by_user.full_name}
              </p>
              <p className="text-xs text-slate-500">
                @{data.archived_by_user.username} • {data.archived_by_user.role_label || data.archived_by_user.role}
              </p>
            </div>
          </div>
        )}


        {data?.approved_by_user && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Кто одобрил</p>
            <div className="mt-1 space-y-1">
              <p className="font-medium text-slate-800">
                {data.approved_by_user.full_name}
              </p>
              <p className="text-xs text-slate-500">
                @{data.approved_by_user.username} • {data.approved_by_user.role_label || data.approved_by_user.role}
              </p>
            </div>
          </div>
        )}


        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">Позиций</p>
          <p className="mt-1 font-medium text-slate-800">
            {data?.items_count ?? 0}
          </p>
        </div>
      </div>


      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={() => navigate(`/archived/${data.id}/`)}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Открыть
        </button>
      </div>
    </div>
  );
};


export const ArchiveList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [searchField, setSearchField] = useState("created_by");


  const {
    data: archiveData = [],
    isLoading,
    isError,
  } = useGetArchivedRequestsQuery();


  const filteredPosts = useMemo(() => {
    let result = [...archiveData];


    if (searchTerm.trim()) {
      const value = searchTerm.toLowerCase();


      result = result.filter((post) => {
        const createdByFullName = post?.created_by_user?.full_name?.toLowerCase() || "";
        const createdByUsername = post?.created_by_user?.username?.toLowerCase() || "";
        const approvedByFullName = post?.approved_by_user?.full_name?.toLowerCase() || "";
        const approvedByUsername = post?.approved_by_user?.username?.toLowerCase() || "";
        const archivedByFullName = post?.archived_by_user?.full_name?.toLowerCase() || "";
        const archivedByUsername = post?.archived_by_user?.username?.toLowerCase() || "";
        const comment = post?.comment?.toLowerCase() || "";
        const requestId = String(post?.id || "").toLowerCase();


        switch (searchField) {
          case "created_by":
            return (
              createdByFullName.includes(value) ||
              createdByUsername.includes(value)
            );
          case "approved_by":
            return (
              approvedByFullName.includes(value) ||
              approvedByUsername.includes(value)
            );
          case "archived_by":
            return (
              archivedByFullName.includes(value) ||
              archivedByUsername.includes(value)
            );
          case "comment":
            return comment.includes(value);
          case "request_id":
            return requestId.includes(value);
          default:
            return false;
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
  }, [archiveData, searchTerm, sortOrder, searchField]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Загрузка архивных заявок...
          </div>
        </div>
      </div>
    );
  }


  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-rose-200 bg-white p-12 text-center text-rose-500">
            Не удалось загрузить архивные заявки
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                Архив заявок
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {filteredPosts.length} из {archiveData.length} архивных заявок
              </p>
            </div>


            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="created_by">Кто создал</option>
                <option value="approved_by">Кто одобрил</option>
                <option value="archived_by">Кто архивировал</option>
                <option value="comment">Комментарий</option>
                <option value="request_id">Номер заявки</option>
              </select>


              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Введите текст для поиска..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-96"
              />


              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
              </select>
            </div>
          </div>
        </div>


        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((request) => (
                <ArchiveRequestCard key={request.id} data={request} />
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
              <h3 className="mb-2 text-xl font-semibold text-slate-800">
                Архив пуст или ничего не найдено
              </h3>
              <p className="text-slate-500">
                {searchTerm
                  ? "Попробуйте изменить критерий поиска или текст"
                  : "В архиве пока нет заявок"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
