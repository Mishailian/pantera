import { useState } from "react";
import { useAddRoleMutation } from "../../app/api/apiSlice";

export const AddTag = () => {
  const [addRole, { isLoading }] = useAddRoleMutation();

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const handleSubmit = async () => {
    setErrorText("");
    setSuccessText("");

    try {
      await addRole({
        name: form.name,
        description: form.description,
      }).unwrap();

      setSuccessText("Роль успешно создана.");
      setForm({
        name: "",
        description: "",
      });
    } catch (error) {
      setErrorText(error?.data?.error || "Не удалось создать роль.");
    }
  };

  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Новая роль</h2>
        <p className="mt-1 text-sm text-slate-500">
          Укажи системное имя роли и человекочитаемое описание.
        </p>
      </div>

      {errorText ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorText}
        </div>
      ) : null}

      {successText ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successText}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Имя роли (на английском)
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Например: warehouse_department"
            className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Описание
          </span>
          <input
            type="text"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Например: Склад"
            className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !form.name.trim()}
        className="mt-4 inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Создание..." : "Создать роль"}
      </button>
    </div>
  );
};