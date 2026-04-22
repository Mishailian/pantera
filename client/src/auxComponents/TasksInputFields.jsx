import { useMemo, useState } from "react";
import DatePicker from "react-datepicker";

const UNIT_OPTIONS = [
  "мм",
  "см",
  "м",
  "кг",
  "шт",
  "комп",
  "упак",
  "компл",
];

export const TasksInputFields = (props) => {
  const [isUnitsOpen, setIsUnitsOpen] = useState(false);

  const updateField = (field, value) => {
    props.chenge((data) => ({
      ...data,
      [props.id]: {
        ...data[props.id],
        [field]: value,
      },
    }));
  };

  const unitValue = props?.data?.units ?? "";

  const filteredUnits = useMemo(() => {
    const value = String(unitValue).trim().toLowerCase();

    if (!value) return UNIT_OPTIONS;

    return UNIT_OPTIONS.filter((unit) =>
      unit.toLowerCase().includes(value)
    );
  }, [unitValue]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <input
            value={props.data.title ?? ""}
            onChange={(e) => updateField("title", e.target.value)}
            type="text"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
            placeholder="Наименование"
          />
        </div>

        <div className="relative xl:col-span-2">
          <div className="relative">
            <input
              value={unitValue}
              onChange={(e) => {
                updateField("units", e.target.value);
              }}
              type="text"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 outline-none"
              placeholder="Ед. изм."
            />

            <button
              type="button"
              onClick={() => setIsUnitsOpen((prev) => !prev)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
            >
              ▾
            </button>
          </div>

          {isUnitsOpen && (
            <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
              {filteredUnits.length ? (
                filteredUnits.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      updateField("units", unit);
                      setIsUnitsOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {unit}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-400">
                  Нет совпадений, можно вписать свой вариант
                </div>
              )}
            </div>
          )}
        </div>

        <div className="xl:col-span-2">
          <input
            value={props.data.quantity ?? ""}
            onChange={(e) => updateField("quantity", e.target.value)}
            type="number"
            min="0"
            step="any"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
            placeholder="0"
          />
        </div>

        <div className="xl:col-span-2">
          <div className="h-12 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <DatePicker
              dateFormat={"dd.MM.yyyy"}
              selected={props.data.deadline ? new Date(props.data.deadline) : null}
              onChange={(date) => updateField("deadline", date)}
              className="h-full w-full px-4 text-sm text-slate-800 outline-none"
              placeholderText="дд.мм.гггг"
            />
          </div>
        </div>

        <div className="xl:col-span-12">
          <textarea
            value={props.data.about ?? ""}
            onChange={(e) => updateField("about", e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
            placeholder="Дополнительная информация"
          />
        </div>
      </div>
    </div>
  );
};