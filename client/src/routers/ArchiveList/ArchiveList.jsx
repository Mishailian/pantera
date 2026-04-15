import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetArchivedRequestsQuery } from "../../app/api/apiSlice";

const ArchiveRequestRow = ({ data }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:px-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[110px_minmax(0,1.2fr)_minmax(0,1.2fr)_180px_180px_140px] lg:items-center">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Архив
          </span>
          <span className="text-base font-bold text-slate-900">№ {data?.id}</span>
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Логин
          </div>
          <div className="truncate text-base font-semibold text-slate-900">
            @{data?.created_by_user?.username || "unknown"}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Создатель
          </div>
          <div className="truncate text-base font-medium text-slate-700">
            {data?.created_by_user?.full_name || "Неизвестный пользователь"}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Дата создания
          </div>
          <div className="text-sm font-medium text-slate-800">
            {data?.created_at_formatted || "—"}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Дата архивации
          </div>
          <div className="text-sm font-medium text-slate-800">
            {data?.archived_at_formatted || data?.closed_at_formatted || "—"}
          </div>
        </div>

        <div className="flex items-center justify-start lg:justify-end">
          <button
            type="button"
            onClick={() => navigate(`/archived/${data.id}/`)}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Открыть
          </button>
        </div>
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
        const assignedToFullName = post?.assigned_to_at_archive_user?.full_name?.toLowerCase() || post?.assigned_to_user?.full_name?.toLowerCase() || "";
        const assignedToUsername = post?.assigned_to_at_archive_user?.username?.toLowerCase() || post?.assigned_to_user?.username?.toLowerCase() || "";
        const comment = post?.comment?.toLowerCase() || "";
        const requestId = String(post?.id || "").toLowerCase();

        switch (searchField) {
          case "assigned_to":
            return (
              assignedToFullName.includes(value) ||
              assignedToUsername.includes(value)
            );
          case "created_by":
            return (
              createdByFullName.includes(value) ||
              createdByUsername.includes(value)
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
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">
            Загрузка архивных заявок...
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center text-rose-500 shadow-sm">
            Не удалось загрузить архивные заявки
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Архив заявок
              </h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                {filteredPosts.length} из {archiveData.length} архивных заявок
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
              >
                <option value="created_by">Создатель</option>
                  <option value="assigned_to">Кто был закреплён</option>
                <option value="comment">Комментарий</option>
                <option value="request_id">Номер заявки</option>
              </select>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по архиву..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/60 md:w-96"
              />

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          {filteredPosts.length > 0 ? (
            <div className="space-y-3">
              {filteredPosts.map((request) => (
                <ArchiveRequestRow key={request.id} data={request} />
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
                  ? "Попробуйте изменить текст поиска"
                  : "В архиве пока нет заявок"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};