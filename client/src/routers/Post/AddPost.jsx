import { useEffect } from "react";
import { useSelector } from "react-redux";

import { useAddField } from "../../hooks/useAddField/useAddField";
import { useInputCheck } from "../../hooks/useInputCheck";
import { useAddPostMutation } from "../../app/api/apiSlice";
import { staticApi } from "../../static/static";
import { TasksHeader } from "../../forms/tasksHeader";
import { TasksInputFields } from "../../auxСomponents/TasksInputFields";
import { docxCreator } from "../../../docx/docx_creator";

const mapFormToRequestPayload = (formData, itemsData, currentUserId) => {
  const rawItems = Object.values(itemsData || {});

  const items = rawItems
    .filter((item) => {
      const hasTitle = item?.title && String(item.title).trim() !== "";
      const hasUnit = item?.units && String(item.units).trim() !== "";
      const hasQuantity = Number(item?.quantity) > 0;

      return hasTitle && hasUnit && hasQuantity;
    })
    .map((item) => ({
      name: String(item.title).trim(),
      unit: String(item.units).trim(),
      quantity: Number(item.quantity),
      description: item?.about ? String(item.about).trim() : "",
    }));

  return {
    comment: formData?.name ? String(formData.name).trim() : "",
    created_by_id: currentUserId ?? null,
    items,
  };
};

export const AddPost = () => {
  const authUserId = useSelector((state) => state.auth.username_id);

  const s = staticApi();
  const [addPost, { isLoading }] = useAddPostMutation();
  const { formData, handleChange, setData } = useInputCheck();

  const { component, componentData, repeatControll, addField } = useAddField(
    s.structure.addPosition,
    TasksInputFields
  );

  useEffect(() => {
    setData(s.structure.addPost);
  }, [setData, s.structure.addPost]);

  const handleCreatePost = async () => {
    const payload = mapFormToRequestPayload(
      formData,
      componentData.formData,
      authUserId
    );

    if (!payload.items.length) {
      alert("Добавь хотя бы одну корректную позицию: название, единица измерения и количество.");
      return;
    }

    if (!payload.created_by_id) {
      alert("Пользователь не определён. Выполни вход заново.");
      return;
    }

    try {
      docxCreator(componentData.formData);

      const response = await addPost({
        initialState: payload,
      });

      if (response?.error) {
        console.error(response.error);
        alert(response?.error?.data?.error || "Не удалось создать заявку.");
        return;
      }

      handleChange({
        name: "",
        about: "",
        data_dead_line: null,
        author: "",
      });

      alert("Заявка успешно создана.");
    } catch (error) {
      console.error(error);
      alert("Произошла ошибка при создании заявки.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto mb-8 max-w-5xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-8 flex items-center justify-center">
            <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Служебная записка
            </h1>
          </div>

          <TasksHeader />
        </div>

        <div className="max-h-[70vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                Данные документа
              </h2>
            </div>
          </div>

          <div className="max-h-[75vh] space-y-8 overflow-y-auto p-12 pb-8">
            <div className="space-y-6">{component}</div>
          </div>

          <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-3">
              {repeatControll}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-emerald-400/50 bg-emerald-500 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl"
                  onClick={addField}
                >
                  ➕ Добавить поле
                </button>

                <button
                  type="button"
                  data-testid="AddPostSubmite"
                  disabled={isLoading}
                  className="rounded-xl border border-indigo-400/50 bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 font-semibold text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-600 hover:to-purple-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleCreatePost}
                >
                  {isLoading ? "Создание..." : "Добавить заявку"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
