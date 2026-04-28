import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAddPostMutation } from "../../app/api/apiSlice";
import { docxCreator } from "../../../docx/docx_creator";

const UNIT_OPTIONS = ["мм", "см", "м", "кг", "шт", "комп", "упак", "компл"];

const AVAILABLE_SIGNERS = [
  "Суслов В. А.",
  "Гуда Т. А.",
  "Чеченева А. А.",
  "Новосёлова Е. О.",
  "Голубцов Е. С.",
  "Ложкин И. М.",
  "Славных М. А.",
];

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
    acc[index + 1] = {
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
      deadline: row?.deadline ? String(row.deadline).trim() : null, // ДОБАВИЛИ ЭТУ СТРОКУ
    }));

  return {
    comment: "",
    created_by_id: currentUserId ?? null,
    items,
  };
};

const UnitField = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const current = String(value ?? "").trim().toLowerCase();

    if (!current) return UNIT_OPTIONS;

    const matched = UNIT_OPTIONS.filter((item) =>
      item.toLowerCase().includes(current)
    );

    const exactExists = UNIT_OPTIONS.some(
      (item) => item.toLowerCase() === current
    );

    if (!exactExists && current) {
      return [value, ...matched.filter((item) => item !== value)];
    }

    return matched;
  }, [value]);

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder="Выбрать или вписать"
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
      >
        ▾
      </button>

      {open && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {filteredOptions.length ? (
            filteredOptions.map((option, index) => (
              <button
                key={`${option}-${index}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400">
              Нет совпадений. Можно оставить свой вариант.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SignersModal = ({
  open,
  onClose,
  selectedSigners,
  onToggleSigner,
  onReset,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Добавить фамилии
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Выбери сотрудников, которые попадут в DOCX в блок согласования.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {AVAILABLE_SIGNERS.map((signer) => {
            const checked = selectedSigners.includes(signer);

            return (
              <label
                key={signer}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-800">
                  {signer}
                </span>

                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSigner(signer)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Очистить
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddPost = () => {
  const authUserId = useSelector((state) => state.auth.username_id);
  const [addPost, { isLoading }] = useAddPostMutation();
  const [purpose, setPurpose] = useState("");

  const [repeatNext, setRepeatNext] = useState(false);
  const [rows, setRows] = useState([createEmptyRow(1)]);
  const [signersOpen, setSignersOpen] = useState(false);
  const [selectedSigners, setSelectedSigners] = useState([]);

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

  const toggleSigner = (signer) => {
    setSelectedSigners((prev) =>
      prev.includes(signer)
        ? prev.filter((item) => item !== signer)
        : [...prev, signer]
    );
  };

  const handleCreatePost = async () => {
    const payload = mapRowsToRequestPayload(rows, authUserId);
    payload.comment = purpose;

    if (!payload.items.length) {
      alert(
        "Добавь хотя бы одну корректную позицию: название, единица измерения и количество."
      );
      return;
    }

    if (!payload.created_by_id) {
      alert("Пользователь не определён. Выполни вход заново.");
      return;
    }

    try {
      docxCreator(docxPayload, selectedSigners);

      const response = await addPost({
        initialState: payload,
      });

      if (response?.error) {
        console.error(response.error);
        alert(response?.error?.data?.error || "Не удалось создать заявку.");
        return;
      }

      setRows([createEmptyRow(1)]);
      setSelectedSigners([]);
      setPurpose("");
      alert("Заявка успешно создана.");
    } catch (error) {
      console.error(error);
      alert("Произошла ошибка при создании заявки.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h1 className="mb-8 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Служебная записка
          </h1>
          
          <div className="mb-8 rounded-3xl border border-slate-200 bg-indigo-50/50 p-6">
            <label className="block">
              <span className="mb-3 block text-sm font-bold uppercase tracking-[0.1em] text-indigo-900">
                Цель покупки *
              </span>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Опишите, для какой цели вы заказываете данные пункты"
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>
          </div>

          <div className="mb-4 hidden grid-cols-[2.2fr_1.1fr_0.8fr_1.1fr_1.8fr_88px] gap-4 border-b border-slate-200 pb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
            <div>Наименование</div>
            <div>Единица измерения</div>
            <div>Количество</div>
            <div>Планируемый срок</div>
            <div>Дополнительная информация</div>
            <div className="text-center">Удалить</div>
          </div>

          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition hover:bg-slate-100/50 lg:grid-cols-[2.2fr_1.1fr_0.8fr_1.1fr_1.8fr_88px] lg:items-start"
              >
                <div className="lg:hidden">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                    Единица измерения
                  </span>
                  <UnitField
                    value={row.units}
                    onChange={(value) => updateRow(row.id, "units", value)}
                  />
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </label>

                <div className="flex h-full items-end lg:items-start">
                  <span className="mb-2 hidden text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:hidden">
                    Удалить
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-rose-500 text-xl font-bold text-white shadow-sm transition hover:bg-rose-600 active:scale-95"
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Фамилии для документа
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedSigners.length
                    ? selectedSigners.join(", ")
                    : "Пока никто не выбран"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSignersOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Добавить фамилии
              </button>
            </div>
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

      <SignersModal
        open={signersOpen}
        onClose={() => setSignersOpen(false)}
        selectedSigners={selectedSigners}
        onToggleSigner={toggleSigner}
        onReset={() => setSelectedSigners([])}
      />
    </>
  );
};