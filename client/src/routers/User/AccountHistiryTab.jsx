import { useState } from "react";
import {
  useGetProfileHistoryQuery,
} from "../../app/api/apiSlice";
import { CHANGE_BY_ROLE_LABELS, CHANGE_TYPE_LABELS, CHANGE_TYPE_STYLES } from "../../static/static";


const formatChangeDescription = (item) => {
  const type = item.change_type || "name";
  if (type === "password") return "Пароль изменён";
  if (type === "deletion") {
    const name = item.target_full_name || "—";
    return `Аккаунт удалён: ${name}`;
  }
  const oldVal = item.old_value ?? item.old_full_name ?? "—";
  const newVal = item.new_value ?? item.new_full_name ?? "—";
  return `${oldVal || "—"} → ${newVal || "—"}`;
};


export const AccountHistoryTab = () => {
  const [filters, setFilters] = useState({
    number: "",
    full_name: "",
    date: "",
    sort: "desc",
  });

  const { data: history = [], isLoading, isError } =
    useGetProfileHistoryQuery(filters);

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ number: "", full_name: "", date: "", sort: "desc" });
  };

  if (isLoading) return <div>Загрузка истории...</div>;
  if (isError) return <div>Ошибка загрузки истории</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">История изменений аккаунтов</h2>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            value={filters.number}
            onChange={(e) => handleChange("number", e.target.value)}
            placeholder="Фильтр по номеру телефона"
            className="rounded-lg border p-3"
          />
          <input
            type="text"
            value={filters.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="Фильтр по имени / значению"
            className="rounded-lg border p-3"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="rounded-lg border p-3"
          />
          <select
            value={filters.sort}
            onChange={(e) => handleChange("sort", e.target.value)}
            className="rounded-lg border p-3"
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
          </select>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={resetFilters} className="rounded-lg bg-gray-200 px-4 py-2">
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-stone-100 text-left">
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Аккаунт (номер)</th>
              <th className="px-4 py-3">Кто изменил</th>
              <th className="px-4 py-3">Кем был</th>
              <th className="px-4 py-3">Изменение</th>
            </tr>
          </thead>
          <tbody>
            {history.length ? (
              history.map((item) => {
                const type = item.change_type || "name";
                const isDeletion = type === "deletion";
                return (
                  <tr key={item.id} className={`border-t border-stone-200 ${isDeletion ? "bg-red-50 hover:bg-red-100" : "hover:bg-stone-50"}`}>
                    <td className="px-4 py-3 whitespace-nowrap">{item.changed_at_formatted || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${CHANGE_TYPE_STYLES[type] || "bg-stone-100 text-stone-700"}`}>
                        {CHANGE_TYPE_LABELS[type] || type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.target_number || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-stone-700">{item.changed_by_name || "—"}</span>
                      {item.changed_by_number && (
                        <span className="block text-xs text-stone-400">{item.changed_by_number}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {CHANGE_BY_ROLE_LABELS[item.changed_by_role] || item.changed_by_role || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs break-words">
                      {formatChangeDescription(item)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-stone-500">
                  По заданным фильтрам ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

