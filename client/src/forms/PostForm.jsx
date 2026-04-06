export const PostForm = (props) => {
  return (
    <div
      data-testid="PostForm"
      className="group relative w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h5 className="line-clamp-2 text-lg font-semibold text-slate-800">
          {props.name || "Без названия"}
        </h5>

        {/* статус или бейдж можно потом сюда */}
        {props.status && (
          <span className="rounded-xl bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
            {props.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mb-4 space-y-2 text-sm text-slate-600">
        {props.addStuctures ? (
          props.addStuctures
        ) : (
          <p className="text-slate-400">Нет дополнительных данных</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-lg bg-slate-100 px-2 py-1">
            снаб
          </span>
          <span>
            {props.date_create || "—"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {props.buttons}
        </div>
      </div>

      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
      </div>
    </div>
  );
};
