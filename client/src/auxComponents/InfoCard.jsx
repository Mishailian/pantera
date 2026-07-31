
export const InfoCard = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-base font-semibold text-slate-900">
      {value || "—"}
    </p>
    {sub ? <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{sub}</p> : null}
  </div>
);

