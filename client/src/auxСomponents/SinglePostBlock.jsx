import React from "react";


export const SinglePostBlock = ({ data }) => {
  const {
    id,
    status,
    comment,
    created_by_user,
    approved_by_user,
    archived_by_user,
    created_at_formatted,
    updated_at_formatted,
    approved_at_formatted,
    closed_at_formatted,
    archived_at_formatted,
    items,
    items_count,
    mode = "active",
    canManage = false,
  } = data || {};


  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <div className="mb-8 rounded-3xl bg-white p-8 shadow-2xl">
        {/* Заголовок */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Заявка #{id}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                status === "archived" 
                  ? "bg-slate-200 text-slate-700" 
                  : status === "active" 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-amber-100 text-amber-800"
              }`}>
                {status === "archived" ? "Архивная" : status === "active" ? "Активная" : "На рассмотрении"}
              </span>
            </p>
          </div>
          {mode === "archived" && (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              Архивная заявка
            </div>
          )}
        </div>


        {/* Инфоблоки */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Автор заявки</p>
            <p className="mt-1 font-medium text-slate-800">
              {created_by_user?.full_name || created_by_user?.username || "Неизвестно"}
            </p>
            {created_by_user?.role_label && (
              <p className="text-xs text-slate-500">@{created_by_user.username} • {created_by_user.role_label}</p>
            )}
          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Создано</p>
            <p className="mt-1 font-medium text-slate-800">{created_at_formatted || "—"}</p>
          </div>


          {approved_by_user && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Кто одобрил</p>
              <p className="mt-1 font-medium text-slate-800">
                {approved_by_user.full_name}
              </p>
              <p className="text-xs text-slate-500">
                {approved_at_formatted || "—"}
              </p>
            </div>
          )}


          {mode === "archived" && archived_by_user && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Кто архивировал</p>
              <div className="mt-1 space-y-1">
                <p className="font-medium text-slate-800">
                  {archived_by_user.full_name}
                </p>
                <p className="text-xs text-slate-500">
                  @{archived_by_user.username} • {archived_at_formatted || "—"}
                </p>
              </div>
            </div>
          )}


          {mode === "archived" && !archived_by_user && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Архивирована</p>
              <p className="mt-1 font-medium text-slate-800">
                {archived_at_formatted || closed_at_formatted || "—"}
              </p>
            </div>
          )}
        </div>


        {/* Комментарий */}
        {comment && comment.trim() && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h4 className="mb-3 text-sm font-medium text-slate-700">Комментарий</h4>
            <p className="whitespace-pre-wrap text-slate-800">{comment}</p>
          </div>
        )}


        {/* Позиции заявки */}
        <div className="mt-12">
          <h3 className="mb-6 text-lg font-semibold text-slate-800">
            Позиции заявки ({items_count || 0})
          </h3>
          {items && items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Наименование</p>
                      <p className="mt-1 text-slate-800">{item.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Ед. изм.</p>
                      <p className="mt-1 text-slate-800">{item.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Количество</p>
                      <p className="mt-1 font-medium text-slate-800">{item.quantity}</p>
                    </div>
                    <div className={`col-span-1 ${item.is_done ? 'text-emerald-600' : 'text-amber-600'}`}>
                      <p className="text-sm font-medium text-slate-700">Статус</p>
                      <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.is_done 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
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
      </div>
    </div>
  );
};
