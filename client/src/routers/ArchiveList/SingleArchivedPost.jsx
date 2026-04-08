import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetArhiveQuery } from "../../app/api/apiSlice";

export const SingleArchivedPost = () => {
  const { postId } = useParams();

  const { data: archiveList = [], isLoading } = useGetArhiveQuery();

  if (isLoading) return <div className="p-8 text-center">Загрузка...</div>;

  const post = archiveList.find((p) => p.id == postId);
  if (!post) return <div className="p-8 text-center text-red-600">Заявка не найдена</div>;

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <div className="mb-8 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Заявка #{post.id}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{post.status}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            Архивная заявка
          </div>
        </div>

        {/* Информация о заявке */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Создатель</p>
            <p className="mt-1 font-medium text-slate-800">
              {post.created_by_user?.full_name || post.created_by_user?.username || "Неизвестно"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Создано</p>
            <p className="mt-1 font-medium text-slate-800">{post.created_at_formatted}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Одобрено</p>
            <p className="mt-1 font-medium text-slate-800">
              {post.approved_by_user?.full_name || post.approved_at_formatted || "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Закрыто</p>
            <p className="mt-1 font-medium text-slate-800">{post.closed_at_formatted}</p>
          </div>
        </div>

        {/* Позиции заявки */}
        <div className="mt-12">
          <h3 className="mb-6 text-lg font-semibold text-slate-800">
            Позиции заявки ({post.items_count})
          </h3>
          {post.items && post.items.length > 0 ? (
            <div className="space-y-4">
              {post.items.map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Наименование</p>
                      <p className="mt-1 text-slate-800">{item.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Ед.</p>
                      <p className="mt-1 text-slate-800">{item.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Кол-во</p>
                      <p className="mt-1 font-medium text-slate-800">{item.quantity}</p>
                    </div>
                    <div className={`col-span-2 ${item.is_done ? 'text-emerald-600' : 'text-amber-600'}`}>
                      <p className="text-sm font-medium text-slate-700">Статус</p>
                      <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        {item.is_done ? 'Выполнено' : 'В работе'}
                      </span>
                    </div>
                    {item.description && (
                      <div className="col-span-full">
                        <p className="text-sm font-medium text-slate-700">Примечание</p>
                        <p className="mt-1 text-slate-800">{item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-500">
              Позиции заявки отсутствуют
            </div>
          )}
        </div>

        {post.comment && post.comment.trim() && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h4 className="mb-3 text-sm font-medium text-slate-700">Комментарий</h4>
            <p className="whitespace-pre-wrap text-slate-800">{post.comment}</p>
          </div>
        )}
      </div>
    </div>
  );
};