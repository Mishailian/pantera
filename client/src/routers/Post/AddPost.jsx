import {
  useGetRoleRequestsCountQuery,
  useGetRoleRequestsQuery,
  useReviewRoleRequestMutation,
} from "../../app/api/apiSlice";


import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  useAddPostMutation,
  useGetTemplatesQuery,
  useAddTemplateMutation,
  useDeleteTemplateMutation,
} from "../../app/api/apiSlice";
import { docxCreator } from "../../../docx/docx_creator";

const UNIT_OPTIONS = ["мм", "см", "м", "кг", "шт", "комп", "упак", "компл"];

const AVAILABLE_SIGNERS = [
  "Начальник МЭС - Суслов В. А.",
  "Начальник МЦ - Гуда Т. А.",
  "Главный бухгалтер - Чеченева А. А.",
  "Начальник HR - Новосёлова Е. О.",
  "Начальник ОИТ - Голубцов Е. С.",
  "Главный механик - Ложкин И. М.",
  "Главный энергетик - Славных М. А.",
  "Зам. начальника ЦПВС - Гуменный А. В.",
  "Начальник цеха ЦПВС - Санников С. В.",
  "Мастер насосной и теплосетей ЦПВС -  Маркевич Е. В.",
  "Начальник производства ШП - Соколова Л. К.",
  "Энергетик - Балашов Ю. А.",
  "Инженер-электроник - Суханов А. П.",
  "Зам. Главного энергетика - Пермяков Н. Ф.",
  "Главный энергетик - Славных М. А.",
  "Начальник РСГ - Жованик А. Ю.",
  "Начальник службы безопасности - Пузырёв В. А.",
  "Заместитель начальника службы безопасности - Ильиных М. Н.",
  "Главный метролог - Корелина Е. В.",
  "Начальник заводской лаборотории - Пономарева Н. Ю.",
  "Главный механик - Ложкин И. М.",
  "Заместитель главного механика - Поспелов С. А.",
  "Начальник инструментального участка - Аленбаторов П. И.",
];


const createEmptyRow = (id, prevRow = null, shouldRepeat = false) => ({
  id,
  title: shouldRepeat && prevRow ? prevRow.title ?? "" : "",
  units: shouldRepeat && prevRow ? prevRow.units ?? "" : "",
  quantity: shouldRepeat && prevRow ? prevRow.quantity ?? 0 : 0,
  deadline: shouldRepeat && prevRow ? prevRow.deadline ?? "" : "",
  about: shouldRepeat && prevRow ? prevRow.about ?? "" : "",
});

const mapRowsToItems = (rows) =>
  rows
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
      deadline: row?.deadline ? String(row.deadline).trim() : null,
    }));

const mapRowsToRequestPayload = (rows, currentUserId, department = "supply") => ({
  comment: "",
  created_by_id: currentUserId ?? null,
  department,
  items: mapRowsToItems(rows),
});

const mapTemplateItemsToRows = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: index + 1,
    title: item?.name ?? "",
    units: item?.unit ?? "",
    quantity: item?.quantity ?? 0,
    deadline: item?.deadline ?? "",
    about: item?.description ?? "",
  }));

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
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 px-6 pt-6 pb-4">
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

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-3 pb-2">
            {AVAILABLE_SIGNERS.map((signer) => {
              const checked = selectedSigners.includes(signer);

              return (
                <label
                  key={signer}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                >
                  <span className="text-sm font-medium leading-5 text-slate-800">
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
        </div>

        <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 px-6 pt-4 pb-6 sm:flex-row sm:justify-between">
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

const TemplatesModal = ({ open, onClose, templates, isLoading, onSelect, onDelete }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Мои шаблоны</h2>
            <p className="mt-1 text-sm text-slate-500">
              Выберите шаблон, чтобы заполнить заявку — после этого всё можно отредактировать.
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

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-400">Загрузка шаблонов...</div>
          ) : templates.length ? (
            <div className="space-y-3 pb-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {tpl.comment?.trim() ? tpl.comment.trim() : "Без цели покупки"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {tpl.items_count} позиций · {tpl.created_at_formatted || ""}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(tpl)}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Выбрать
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(tpl.id)}
                      title="Удалить шаблон"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              Пока нет сохранённых шаблонов.
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-end border-t border-slate-100 px-6 pt-4 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};


const DEPARTMENT_OPTIONS = [
  { value: "supply", label: "Отдел снабжения" },
  // { value: "rezo",   label: "Отдел Резо" },
];

export const AddPost = () => {
  const [removingRowIds, setRemovingRowIds] = useState([]);
  const rowRefs = useRef({});

  const authUserId = useSelector((state) => state.auth.username_id);
  const roles = useSelector((state) => state.auth.roles || []);
  const [addPost, { isLoading }] = useAddPostMutation();
  const [purpose, setPurpose] = useState("");

  const defaultDepartment = (() => {
    const names = roles.map((r) => r?.name);
    if (names.includes("rezo_department") || names.includes("rezo_head")) return "rezo";
    return "supply";
  })();
  const [department, setDepartment] = useState(defaultDepartment);

  const [repeatNext, setRepeatNext] = useState(false);
  const [rows, setRows] = useState([createEmptyRow(1)]);
  const [signersOpen, setSignersOpen] = useState(false);
  const [selectedSigners, setSelectedSigners] = useState([]);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const { data: templates = [], isLoading: isTemplatesLoading } = useGetTemplatesQuery(
    undefined,
    { skip: !templatesOpen }
  );
  const [addTemplate] = useAddTemplateMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1] ?? null;
      const nextId = prev.length
        ? Math.max(...prev.map((row) => row.id)) + 1
        : 1;

      return [
        ...prev,
        createEmptyRow(nextId, lastRow, repeatNext),
      ];
    });

    requestAnimationFrame(() => {
      window.setTimeout(() => {
        const lastElement = Object.values(rowRefs.current).at(-1);

        lastElement?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
    });
  };

  const duplicateRow = (row) => {
    setRows((prev) => {
      const nextId = prev.length
        ? Math.max(...prev.map((item) => item.id)) + 1
        : 1;

      const sourceIndex = prev.findIndex(
        (item) => item.id === row.id
      );

      const copiedRow = {
        ...row,
        id: nextId,
      };

      const nextRows = [...prev];

      nextRows.splice(
        sourceIndex + 1,
        0,
        copiedRow
      );

      return nextRows;
    });
  };

  const removeRow = (id) => {
    if (rows.length === 1) {
      setRows([createEmptyRow(1)]);
      return;
    }

    setRemovingRowIds((prev) => [...prev, id]);

    window.setTimeout(() => {
      setRows((prev) =>
        prev.filter((row) => row.id !== id)
      );

      setRemovingRowIds((prev) =>
        prev.filter((rowId) => rowId !== id)
      );
    }, 180);
  };
  const toggleSigner = (signer) => {
    setSelectedSigners((prev) =>
      prev.includes(signer)
        ? prev.filter((item) => item !== signer)
        : [...prev, signer]
    );
  };

  const handleCreatePost = async () => {
    const payload = mapRowsToRequestPayload(rows, authUserId, department);
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

    // Валидация длины полей перед отправкой
    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      if (item.name && item.name.length > 255) {
        alert(
          `Позиция ${i + 1}: наименование слишком длинное (${item.name.length} символов). ` +
          `Максимально допустимо 255 символов. Сократите текст и попробуйте снова.`
        );
        return;
      }
      if (item.description && item.description.length > 1000) {
        alert(
          `Позиция ${i + 1}: комментарий слишком длинный (${item.description.length} символов). ` +
          `Максимально допустимо 1000 символов.`
        );
        return;
      }
    }

    try {
      const createdRequest = await addPost({
        initialState: payload,
      }).unwrap();

      docxCreator(createdRequest, selectedSigners);

      setRows([createEmptyRow(1)]);
      setSelectedSigners([]);
      setPurpose("");
      alert("Заявка успешно создана.");
    } catch (error) {
      console.error(error);
      alert(error?.data?.error || "Не удалось создать заявку.");
    }
  };

  const handleSaveTemplate = async () => {
    const items = mapRowsToItems(rows);

    if (!items.length && !purpose.trim() && !selectedSigners.length) {
      alert("Нечего сохранять — заполните хотя бы одно поле заявки.");
      return;
    }

    setIsSavingTemplate(true);
    try {
      await addTemplate({
        comment: purpose,
        items,
        signers: selectedSigners,
      }).unwrap();
      alert("Шаблон сохранён.");
    } catch (error) {
      console.error(error);
      alert(error?.data?.error || "Не удалось сохранить шаблон.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setRows(
      mapTemplateItemsToRows(template.items).length
        ? mapTemplateItemsToRows(template.items)
        : [createEmptyRow(1)]
    );
    setPurpose(template.comment || "");
    setSelectedSigners(template.signers || []);
    setTemplatesOpen(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Удалить этот шаблон?")) return;
    try {
      await deleteTemplate(templateId).unwrap();
    } catch (error) {
      console.error(error);
      alert("Не удалось удалить шаблон.");
    }
  };

  return (
    <>
      <div className="min-h-screen ">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Служебная записка
          </h1>
        </div>

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


        <div className="mb-3 hidden grid-cols-[44px_2.2fr_1.1fr_0.8fr_1.1fr_1.8fr_92px] gap-3 px-4 text-xs font-bold uppercase tracking-[0.09em] text-slate-400 lg:grid">
          <div className="text-center">№</div>
          <div>Наименование</div>
          <div>Единица</div>
          <div>Количество</div>
          <div>Срок</div>
          <div>Комментарий</div>
          <div className="text-center">Действия</div>
        </div>

        <div className="space-y-4">


          <div className="space-y-3">
            {rows.map((row, index) => {
              const isRemoving = removingRowIds.includes(row.id);

              return (
                <div
                  key={row.id}
                  ref={(element) => {
                    if (element) {
                      rowRefs.current[row.id] = element;
                    } else {
                      delete rowRefs.current[row.id];
                    }
                  }}
                  className={`
          group grid gap-3 overflow-visible rounded-2xl
          border border-slate-200 bg-white p-4
          shadow-[0_2px_12px_rgba(15,23,42,0.04)]
          transition-all duration-200
          lg:grid-cols-[44px_2.2fr_1.1fr_0.8fr_1.1fr_1.8fr_92px]
          lg:items-start
          ${isRemoving
                      ? "translate-x-3 scale-[0.98] opacity-0"
                      : "animate-[requestRowIn_220ms_ease-out] opacity-100 hover:border-indigo-200 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
                    }
        `}
                >
                  <div className="flex items-center justify-between lg:h-14 lg:justify-center">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                      Позиция
                    </span>

                    <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-slate-100 px-2 text-sm font-bold text-slate-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      {index + 1}
                    </span>
                  </div>

                  <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                      Наименование
                    </span>

                    <textarea
                      value={row.title}
                      onChange={(e) =>
                        updateRow(row.id, "title", e.target.value)
                      }
                      placeholder="Что необходимо приобрести?"
                      rows={1}
                      className="
              min-h-14 w-full resize-none overflow-hidden rounded-xl
              border border-slate-200 bg-slate-50/50
              px-4 py-[17px] text-sm leading-5 text-slate-800
              outline-none transition
              placeholder:text-slate-400
              hover:border-slate-300 hover:bg-white
              focus:border-indigo-500 focus:bg-white
              focus:ring-4 focus:ring-indigo-500/10
            "
                    />
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                      Единица измерения
                    </span>

                    <UnitField
                      value={row.units}
                      onChange={(value) =>
                        updateRow(row.id, "units", value)
                      }
                    />
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                      Количество
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={row.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "quantity",
                          e.target.value
                        )
                      }
                      className="
              h-14 w-full rounded-xl border border-slate-200
              bg-slate-50/50 px-4 text-sm text-slate-800
              outline-none transition
              hover:border-slate-300 hover:bg-white
              focus:border-indigo-500 focus:bg-white
              focus:ring-4 focus:ring-indigo-500/10
            "
                    />
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                      Планируемый срок
                    </span>

                    <input
                      type="date"
                      value={row.deadline}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "deadline",
                          e.target.value
                        )
                      }
                      className="
              h-14 w-full rounded-xl border border-slate-200
              bg-slate-50/50 px-4 text-sm text-slate-700
              outline-none transition
              hover:border-slate-300 hover:bg-white
              focus:border-indigo-500 focus:bg-white
              focus:ring-4 focus:ring-indigo-500/10
            "
                    />
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                      Дополнительная информация
                    </span>

                    <textarea
                      value={row.about}
                      onChange={(e) =>
                        updateRow(row.id, "about", e.target.value)
                      }
                      placeholder="Марка, ГОСТ, характеристики..."
                      rows={1}
                      className="
              min-h-14 w-full resize-none overflow-hidden rounded-xl
              border border-slate-200 bg-slate-50/50
              px-4 py-[17px] text-sm leading-5 text-slate-800
              outline-none transition
              placeholder:text-slate-400
              hover:border-slate-300 hover:bg-white
              focus:border-indigo-500 focus:bg-white
              focus:ring-4 focus:ring-indigo-500/10
            "
                    />
                  </label>

                  <div className="flex h-14 items-center gap-2 lg:justify-center">
                    <button
                      type="button"
                      onClick={() => duplicateRow(row)}
                      title="Дублировать позицию"
                      aria-label={`Дублировать позицию ${index + 1}`}
                      className="
              flex h-10 flex-1 items-center justify-center rounded-xl
              border border-slate-200 bg-white
              text-lg text-slate-500 transition
              hover:border-indigo-200 hover:bg-indigo-50
              hover:text-indigo-600 active:scale-95
              lg:w-10 lg:flex-none
            "
                    >
                      ⧉
                    </button>

                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      title="Удалить позицию"
                      aria-label={`Удалить позицию ${index + 1}`}
                      className="
              flex h-10 flex-1 items-center justify-center rounded-xl
              border border-rose-100 bg-rose-50
              text-xl font-medium text-rose-500 transition
              hover:border-rose-200 hover:bg-rose-100
              hover:text-rose-700 active:scale-95
              lg:w-10 lg:flex-none
            "
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="
    mt-4 flex w-full items-center justify-center gap-2
    rounded-2xl border-2 border-dashed border-slate-200
    bg-slate-50/50 px-5 py-4
    text-sm font-semibold text-slate-500
    transition-all duration-200
    hover:border-indigo-300 hover:bg-indigo-50/60
    hover:text-indigo-700
    active:scale-[0.995]
  "
          >
            <span className="text-xl leading-none">+</span>
            Добавить ещё одну позицию
          </button>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-slate-800">
                    Подписанты документа
                  </div>

                  {selectedSigners.length > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                      {selectedSigners.length}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSigners.length ? (
                    selectedSigners.map((signer) => (
                      <button
                        key={signer}
                        type="button"
                        onClick={() => toggleSigner(signer)}
                        title="Убрать подписанта"
                        className="
                inline-flex max-w-full items-center gap-2
                rounded-full border border-indigo-100
                bg-white px-3 py-1.5
                text-xs font-medium text-slate-600
                transition
                hover:border-rose-200
                hover:bg-rose-50
                hover:text-rose-600
              "
                      >
                        <span className="truncate">{signer}</span>
                        <span className="text-base leading-none">×</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      Подписанты пока не выбраны
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSignersOpen(true)}
                className="
        inline-flex shrink-0 items-center justify-center gap-2
        rounded-xl border border-slate-300 bg-white
        px-5 py-3 text-sm font-semibold text-slate-700
        shadow-sm transition
        hover:border-indigo-300
        hover:bg-indigo-50
        hover:text-indigo-700
        active:scale-[0.98]
      "
              >
                <span className="text-lg leading-none">+</span>
                Добавить фамилии
              </button>
            </div>
          </div>

        </div>


        <div className="sticky bottom-4 z-10 mt-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={repeatNext}
                onChange={(e) =>
                  setRepeatNext(e.target.checked)
                }
                className="peer sr-only"
              />

              <span className="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600">
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>

              <span>
                <span className="block text-sm font-semibold text-slate-700">
                  Повторять предыдущую позицию
                </span>
                <span className="block text-xs text-slate-400">
                  Новая строка будет заполнена теми же данными
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setTemplatesOpen(true)}
                className="
          inline-flex items-center justify-center rounded-xl
          border border-slate-300 bg-white px-5 py-3
          text-sm font-semibold text-slate-700
          transition hover:bg-slate-100
          active:scale-[0.98]
        "
              >
                Шаблоны
              </button>

              <button
                type="button"
                disabled={isSavingTemplate}
                onClick={handleSaveTemplate}
                className="
          inline-flex items-center justify-center rounded-xl
          border border-slate-300 bg-white px-5 py-3
          text-sm font-semibold text-slate-700
          transition hover:bg-slate-100
          active:scale-[0.98]
          disabled:cursor-not-allowed disabled:opacity-50
        "
              >
                {isSavingTemplate
                  ? "Сохранение..."
                  : "Сохранить как шаблон"}
              </button>

              <button
                type="button"
                data-testid="AddPostSubmite"
                disabled={isLoading}
                onClick={handleCreatePost}
                className="
          inline-flex min-w-[190px] items-center justify-center
          rounded-xl bg-indigo-600 px-6 py-3
          text-sm font-bold text-white shadow-lg
          shadow-indigo-600/20 transition
          hover:bg-indigo-700 hover:shadow-indigo-600/30
          active:scale-[0.98]
          disabled:cursor-not-allowed disabled:opacity-50
        "
              >
                {isLoading
                  ? "Создание заявки..."
                  : "Сформировать заявку"}
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

      <TemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        isLoading={isTemplatesLoading}
        onSelect={handleSelectTemplate}
        onDelete={handleDeleteTemplate}
      />
    </>
  );
};
