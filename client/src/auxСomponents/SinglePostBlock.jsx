import { useState, useMemo, useEffect } from "react";
import { ApplicationBlock } from "./ApplicationBlock";

export const SinglePostBlock = (props) => {
  const postData = props.data;
  const inputData = props?.localState?.[0]?.formData;
  const handleChange = props.obj?.handleChange;
  const handleSubmit = props.obj?.handleSubmit;
  const setData = props.obj?.setData;

  const postId = Number(postData?.postId ?? postData?.id);
  const isSuperuser = postData?.is_superuser;

  const [isSubmit, setSubmit] = useState(false);
  const [items, setItems] = useState(Array.isArray(postData?.items) ? postData.items : []);

  const obj = useMemo(
    () => ({
      comment: postData?.comment ?? "",
      status: postData?.status ?? "undeclared",
      items: Array.isArray(postData?.items) ? postData.items : [],
    }),
    [postData?.comment, postData?.status, postData?.items]
  );

  const submitChanges = () => {
    handleSubmit?.(props.chPost);
  };

  useEffect(() => {
    setData?.(obj, { postId });
  }, [obj, postId, setData]);

  useEffect(() => {
    if (isSubmit) {
      submitChanges();
      setSubmit(false);
    }
  }, [isSubmit]);

  useEffect(() => {
    setItems(Array.isArray(postData?.items) ? postData.items : []);
  }, [postData?.items]);

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value) : value,
            }
          : item
      )
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-8 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                Просмотр заявки #{postData?.id}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Статус: <span className="font-medium text-slate-700">{postData?.status}</span>
              </p>
            </div>

            {postData?.textInButton ? (
              <div className="inline-flex items-center rounded-2xl bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
                {postData.textInButton}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-8 p-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                Основные данные
              </h3>
            </div>


            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Создана</p>
                <p className="mt-1 font-medium text-slate-800">{postData?.created_at || "—"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Подтверждена</p>
                <p className="mt-1 font-medium text-slate-800">{postData?.approved_at || "—"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                Позиции заявки
              </h3>
            </div>

            <div className="space-y-4">
              {items.length ? (
                items.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Наименование
                        </span>
                        <input
                          type="text"
                          value={item.name ?? ""}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Единица измерения
                        </span>
                        <input
                          type="text"
                          value={item.unit ?? ""}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Количество
                        </span>
                        <input
                          type="number"
                          value={item.quantity ?? 0}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Выполнено
                        </span>
                        <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-4">
                          <input
                            type="checkbox"
                            checked={Boolean(item.is_done)}
                            onChange={(e) => updateItem(index, "is_done", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm text-slate-700">
                            {item.is_done ? "Да" : "Нет"}
                          </span>
                        </div>
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Описание
                        </span>
                        <textarea
                          value={item.description ?? ""}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          rows={3}
                          className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                        />
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                  В заявке пока нет позиций для отображения.
                </div>
              )}
            </div>
          </div>
        </div>

        {isSuperuser ? (
          <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6">
            <div className="flex justify-end">
              <button
                type="button"
                data-testid="SinglePostBlockSubmite"
                onClick={() => {
                  handleChange?.({
                    comment: postData?.comment ?? "",
                    items,
                  });
                  setSubmit(true);
                }}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-600 hover:to-purple-700 hover:shadow-2xl"
              >
                {postData?.textInButton || "Сохранить изменения"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
