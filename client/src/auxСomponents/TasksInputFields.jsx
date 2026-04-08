import NumberPicker from "react-widgets/NumberPicker";
import Combobox from "react-widgets/Combobox";
import "react-widgets/styles.css";

export const TasksInputFields = (props) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md md:px-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-start md:gap-4">
        <div className="md:col-span-1">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            №
          </div>
          <div className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 shadow-sm">
            {props.name}
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            Наименование
          </label>
          <input
            value={props.data?.[props.name]?.title ?? ""}
            name="title"
            type="text"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Наименование позиции"
            onChange={(el) => props.chenge({ title: el.target.value }, props.name)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            Ед.изм.
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <Combobox
              className="w-full bg-transparent text-sm font-medium"
              value={props.data?.[props.name]?.units ?? ""}
              data={["мм", "см", "м", "кг", "шт", "комп", "упак", "компл"]}
              placeholder="Выберите ед."
              onChange={(el) => props.chenge({ units: el }, props.name)}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            Кол-во
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <NumberPicker
              value={props.data?.[props.name]?.quantity ?? 0}
              defaultValue={0}
              className="w-full bg-transparent text-base font-semibold"
              step={1}
              min={0}
              onChange={(el) => props.chenge({ quantity: el }, props.name)}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            План. срок
          </label>
          <input
            type="date"
            value={props.data?.[props.name]?.deadline ?? ""}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            onChange={(n) => props.chenge({ deadline: n.target.value }, props.name)}
          />
        </div>

        <div className="md:col-span-1">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            Действия
          </label>
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-lg font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-rose-600 hover:to-rose-700 hover:shadow-lg active:scale-95"
            onClick={(event) => {
              props.eventFunc(props.name);
              event.preventDefault();
            }}
            title="Удалить строку"
          >
            {props.eventFuncName || "-"}
          </button>
        </div>

        <div className="md:col-span-12">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:hidden">
            Дополнительная информация
          </label>
          <input
            value={props.data?.[props.name]?.about ?? ""}
            name="about"
            type="text"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Дополнительная информация"
            onChange={(el) => props.chenge({ about: el.target.value }, props.name)}
          />
        </div>
      </div>
    </div>
  );
};