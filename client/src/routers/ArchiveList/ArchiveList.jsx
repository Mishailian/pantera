import { useGetArchivedRequestsQuery } from "../../app/api/apiSlice";
import { progressCheck } from "../../progressCheck";
import { useNavigate } from "react-router-dom";

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
              {data?.closed_at_formatted || "—"}
            </p>
          </div>
        </div>

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
  const archiveObject = useGetArchivedRequestsQuery();

  const content = progressCheck(archiveObject, (data) => {
    if (!Array.isArray(data) || !data.length) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
          <h3 className="mb-2 text-xl font-semibold text-slate-800">
            Архив пуст
          </h3>
          <p className="text-slate-500">
            В архиве пока нет заявок
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {data.map((request) => (
          <ArchiveRequestCard key={request.id} data={request} />
        ))}
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Архив заявок
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Все завершённые и архивные заявки
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {content}
        </div>
      </div>
    </div>
  );
};