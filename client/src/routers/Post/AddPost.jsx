import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAddPostMutation } from "../../app/api/apiSlice";
import { docxCreator } from "../../../docx/docx_creator";

const UNIT_OPTIONS = ["мм", "см", "м", "кг", "шт", "комп", "упак", "компл"];

const createEmptyRow = (id, prevRow = null, shouldRepeat = false) => ({
  id,
  title: shouldRepeat && prevRow ? prevRow.title ?? "" : "",
  units: shouldRepeat && prevRow ? prevRow.units ?? "" : "",
  quantity: shouldRepeat && prevRow ? prevRow.quantity ?? 0 : 0,
  deadline: shouldRepeat && prevRow ? prevRow.deadline ?? "" : "",
  about: shouldRepeat && prevRow ? prevRow.about ?? "" : "",
});

const mapRowsToDocxPayload = (rows) => {
  return rows.reduce((acc, row, index) => {
    acc[index] = {
      title: row.title,
      units: row.units,
      quantity: row.quantity,
      deadline: row.deadline,
      about: row.about,
    };
    return acc;
  }, {});
};

const mapRowsToRequestPayload = (rows, currentUserId) => {
  const items = rows
    .filter((row) => {
      const hasTitle = row?.title && String(row.title).trim() !== "";
      const hasUnit = row?.units && String(row.units).trim() !== "";
      const hasQuantity = Number(row?.quantity) > 0;
      return hasTitle && hasUnit && hasQuantity;
    })
    .map((row) => ({
      name: String(row.title).trim(),
      unit: String(row.units).trim(),
      quantity: Number(row.quantity),
      description: row?.about ? String(row.about).trim() : "",
    }));

  return {
    comment: "",
    created_by_id: currentUserId ?? null,
    items,
  };
};

export const AddPost = () => {
  const authUserId = useSelector((state) => state.auth.username_id);
  const [addPost, { isLoading }] = useAddPostMutation();
  const [repeatNext, setRepeatNext] = useState(false);
  const [rows, setRows] = useState([createEmptyRow(1)]);

  const docxPayload = useMemo(() => mapRowsToDocxPayload(rows), [rows]);

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1] ?? null;
      const nextId = prev.length ? Math.max(...prev.map((row) => row.id)) + 1 : 1;
      return [...prev, createEmptyRow(nextId, lastRow, repeatNext)];
    });
  };

  const removeRow = (id) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return [createEmptyRow(1)];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const handleCreatePost = async () => {
    const payload = mapRowsToRequestPayload(rows, authUserId);

    if (!payload.items.length) {
      alert("Добавь хотя бы одну корректную позицию: название, единица измерения и количество.");
      return;
    }

    if (!payload.created_by_id) {
      alert("Пользователь не определён. Выполни вход заново.");
      return;
    }

    try {
      docxCreator(docxPayload);

      const response = await addPost({
        initialState: payload,
      });

      if (response?.error) {
        console.error(response.error);
        alert(response?.error?.data?.error || "Не удалось создать заявку.");
        return;
      }

      setRows([createEmptyRow(1)]);
      alert("Заявка успешно создана.");
    } catch (error) {
      console.error(error);
      alert("Произошла ошибка при создании заявки.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Служебная записка
        </h1>

        <div className="mb-4 hidden grid-cols-[2.2fr_1.1fr_0.8fr_1.1fr_1.8fr_88px] gap-4 border-b border-slate-200 pb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
          <div>Наименование</div>
          <div>Еденица измерения</div>
          <div>Количество</div>
          <div>Планируемый срок</div>
          <div>Дополнительная информация</div>
          <div className="text-center">Удалить</div>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 lg:grid-cols-[2.2fr_1.1fr_0.8fr_1.1fr_1.8fr_88px] lg:items-start"
            >
              <div className="lg:hidden">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Позиция {index + 1}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                  Наименование
                </span>
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(row.id, "title", e.target.value)}
                  placeholder="Наименование"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                  Еденица измерения
                </span>
                <select
                  value={row.units}
                  onChange={(e) => updateRow(row.id, "units", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">Выберите</option>
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                  Количество
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                  Планируемый срок
                </span>
                <input
                  type="date"
                  value={row.deadline}
                  onChange={(e) => updateRow(row.id, "deadline", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                  Дополнительная информация
                </span>
                <input
                  type="text"
                  value={row.about}
                  onChange={(e) => updateRow(row.id, "about", e.target.value)}
                  placeholder="Комментарий"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                  Удалить
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-rose-500 text-xl font-bold text-white transition hover:bg-rose-600 active:scale-95"
                >
                  -
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={repeatNext}
              onChange={(e) => setRepeatNext(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            повторять
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600"
            >
              Добавить строчку
            </button>

            <button
              type="button"
              data-testid="AddPostSubmite"
              disabled={isLoading}
              onClick={handleCreatePost}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Создание..." : "Добавить заявку"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
