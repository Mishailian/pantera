import ru from "date-fns/locale/ru";
import NumberPicker from "react-widgets/NumberPicker";
import Combobox from "react-widgets/Combobox";
import "react-widgets/styles.css";

export const TasksInputFields = (props) => {
  return (
    <div className="min-h-[160px] rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-lg hover:shadow-xl transition-all duration-200 p-8">
      <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-end h-full">
        {/* № */}
        <div className="col-span-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            №
          </label>
          <div className="w-full h-14 bg-slate-100 rounded-xl flex items-center justify-center font-mono text-xl font-bold text-slate-800 border-2 border-slate-300 shadow-sm">
            {props.name}
          </div>
        </div>

        {/* Наименование */}
        <div className="col-span-4">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Наименование
          </label>
          <input
            value={props.data?.[props.name]?.title ?? ""}
            name="title"
            type="text"
            className="w-full h-14 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-base font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all duration-200 shadow-sm hover:border-slate-300 hover:shadow-md"
            placeholder="Наименование позиции"
            onChange={(el) => props.chenge({ title: el.target.value }, props.name)}
          />
        </div>

        {/* Единица измерения */}
        <div className="col-span-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Ед.изм.
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 bg-white p-2 shadow-sm hover:border-slate-300 hover:shadow-md focus-within:border-indigo-500 focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-200">
            <Combobox
              className="w-full h-full bg-transparent text-base font-medium"
              value={props.data?.[props.name]?.units ?? ""}
              data={["мм", "см", "м", "кг", "шт", "комп", "упак", "компл"]}
              placeholder="Ед."
              onChange={(el) => {
                props.chenge(
                  {
                    units: el,
                  },
                  props.name
                );
              }}
            />
          </div>
        </div>

        {/* Количество - ПОШИРЕ */}
        <div className="col-span-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Кол-во
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 hover:shadow-md focus-within:border-indigo-500 focus-within:shadow-md focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-200">
            <NumberPicker
              value={props.data?.[props.name]?.quantity ?? 0}
              defaultValue={0}
              className="w-full h-full bg-transparent text-lg font-bold text-right"
              step={1}
              min={0}
              onChange={(el) =>
                props.chenge(
                  {
                    quantity: el,
                  },
                  props.name
                )
              }
            />
          </div>
        </div>

        {/* Срок */}
        <div className="col-span-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            План. срок
          </label>
          <input
            type="date"
            value={props.data?.[props.name]?.deadline ?? ""}
            className="w-full h-14 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-base font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all duration-200 shadow-sm hover:border-slate-300 hover:shadow-md"
            onChange={(n) =>
              props.chenge(
                {
                  deadline: n.target.value,
                },
                props.name
              )
            }
          />
        </div>

        {/* Удалить */}
        <div className="col-span-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Действия
          </label>
          <button
            type="button"
            className="w-full h-14 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 border border-rose-400/50 flex items-center justify-center text-sm"
            onClick={(event) => {
              props.eventFunc(props.name);
              event.preventDefault();
            }}
            title="Удалить строку"
          >
            {props.eventFuncName || "-"}
          </button>
        </div>
      </div>
    </div>
  );
};