import {
  useGetDeletedRequestsQuery,
} from "../../app/api/apiSlice";
import { STATUS_LABELS } from "../../static/static";
import { useState } from "react";



export const DeletedRequestsTab = () => {
  const [expandedId, setExpandedId] = useState(null);
  const { data: deletedList = [], isLoading, isError } = useGetDeletedRequestsQuery();

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка загрузки удалённых заявок</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Удалённые заявки</h2>
        <p className="mt-1 text-sm text-stone-500">
          Все удалённые заявки с историей — кто, когда и по какой причине.
        </p>
      </div>

      {deletedList.length === 0 ? (
        <div className="rounded-lg bg-white px-6 py-10 text-center text-stone-500 shadow-sm">
          Нет удалённых заявок
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deletedList.map((rec) => {
            const snap = rec.snapshot || {};
            const isExpanded = expandedId === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border border-rose-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                      Заявка #{rec.original_id}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      Удалена: {rec.deleted_at_formatted || "-"}
                    </span>
                    {rec.deleted_by_user ? (
                      <span className="text-sm text-slate-500">
                        Кем: {rec.deleted_by_user.full_name || rec.deleted_by_user.number || "—"}
                        {rec.deleted_by_user.number ? ` (${rec.deleted_by_user.number})` : ""}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Кем: неизвестно</span>
                    )}
                    {rec.reason ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 ring-1 ring-amber-200">
                        Причина: {rec.reason}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Без причины</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">
                      Создана: {snap.created_at_formatted || "-"} •{" "}
                      {snap.created_by_user?.full_name || "Неизвестно"}
                      {snap.created_by_user?.role_label ? ` (${snap.created_by_user.role_label})` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      {isExpanded ? "Скрыть" : "Подробнее"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Статус на момент удаления</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{STATUS_LABELS[snap.status] || snap.status || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Кол-во позиций</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{snap.items_count ?? snap.items?.length ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Кто создал</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {snap.created_by_user?.full_name || "—"}
                          {snap.created_by_user?.number ? ` · ${snap.created_by_user.number}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Отдел</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{snap.created_by_user?.role_label || "—"}</p>
                      </div>
                    </div>

                    {snap.comment && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Цель покупки</p>
                        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{snap.comment}</p>
                      </div>
                    )}

                    {snap.items && snap.items.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Позиции заявки</p>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <th className="px-3 py-2">№</th>
                                <th className="px-3 py-2">Наименование</th>
                                <th className="px-3 py-2">Ед.</th>
                                <th className="px-3 py-2">Кол-во</th>
                                <th className="px-3 py-2">Срок</th>
                                <th className="px-3 py-2">Комментарий</th>
                              </tr>
                            </thead>
                            <tbody>
                              {snap.items.map((item, i) => (
                                <tr key={item.id || i} className="border-t border-slate-100">
                                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-pre-wrap">{item.name || "—"}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.unit || "—"}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.quantity ?? "—"}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.deadline || "—"}</td>
                                  <td className="px-3 py-2 text-slate-600 whitespace-pre-wrap">{item.description || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

