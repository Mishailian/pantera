export const TasksHeader = () => {
  return (
    <div
      data-testid="TasksHeader"
      className="hidden rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-[12px] font-bold uppercase tracking-[0.12em] text-slate-600 shadow-sm md:grid md:grid-cols-12 md:gap-4"
    >
      <div className="md:col-span-1">№</div>
      <div className="md:col-span-4">Наименование</div>
      <div className="md:col-span-2 whitespace-nowrap">Единица измерения</div>
      <div className="md:col-span-2">Количество</div>
      <div className="md:col-span-2">План. срок</div>
      <div className="md:col-span-1 text-center">Действия</div>
      <div className="md:col-span-12 pt-2 text-slate-500">Дополнительная информация</div>
    </div>
  );
};