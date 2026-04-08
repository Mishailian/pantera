import { useNavigate } from "react-router-dom";

const ROLE_LABELS = {
  admin: "Администратор",
  supply_manager: "Снабженец",
  default: "Пользователь",
};

export const ActivePostBlock = ({ data, canManage, onArchive, onDelete }) => {
  const navigate = useNavigate();

  const author = data?.created_by_user;
  const createdDate = data?.created_at_formatted || data?.created_at || "Дата неизвестна";
  const approvedDate = data?.approved_at_formatted || data?.approved_at || "Дата неизвестна";
  const comment = data?.comment?.trim() || "Комментарий отсутствует";
  const itemsCount = data?.items_count ?? data?.items?.length ?? 0;

  const handleOpen = () => {
    navigate(`/store/${data.id}/`);
  };

  const handleArchive = async (e) => {
    e.stopPropagation();
    await onArchive?.(data.id);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await onDelete?.(data.id);
  };

  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50 p-6 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="inline-flex items-center rounded-xl bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Активная заявка № {data?.id}
            </div>

            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {ROLE_LABELS[author?.role] || author?.role_label || "Пользователь"}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              @{author?.username || "unknown"}
            </h3>

            <p className="text-base leading-8 text-slate-600">
              {author?.full_name || "Неизвестный пользователь"}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="inline-flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium text-slate-700">{createdDate}</span>
            </div>

            <div className="inline-flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-slate-700">
                Подписана: {approvedDate}
              </span>
            </div>

            <div className="inline-flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V7a2 2 0 00-2-2h-3V3.5A1.5 1.5 0 0013.5 2h-3A1.5 1.5 0 009 3.5V5H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
                />
              </svg>
              <span className="text-sm font-medium text-slate-700">
                Позиций: {itemsCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="p-6">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Комментарий
            </h4>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
              {comment}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Открыть
              </button>

              {canManage ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                  >
                    В архив
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-600"
                  >
                    Удалить
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};