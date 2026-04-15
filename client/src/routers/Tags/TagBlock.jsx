const ROW_COLORS = [
  "bg-slate-50",
  "bg-slate-100",
  "bg-slate-50",
  "bg-slate-100",
];

export const TagBlock = ({ tag, index = 0 }) => {
  const bg = ROW_COLORS[index % ROW_COLORS.length];

  return (
    <div
      className={`${bg} flex items-center justify-between gap-3 px-4 py-3`}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">
          {tag.description || tag.name}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 break-all">
          {tag.name}
        </div>
      </div>

      {tag.name === "admin" && (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Системная
        </span>
      )}
    </div>
  );
};