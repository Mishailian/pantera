import { useState } from "react";
import { useGetProfileHistoryQuery } from "../../app/api/apiSlice";

export const ProfileHistory = () => {
  const [filters, setFilters] = useState({
    username: "",
    full_name: "",
    date: "",
    sort: "desc",
  });

  const { data: history = [], isLoading, isError } =
    useGetProfileHistoryQuery(filters);

  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      username: "",
      full_name: "",
      date: "",
      sort: "desc",
    });
  };

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка загрузки истории</div>;

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold">История изменения имён</h2>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            value={filters.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="Фильтр по логину"
            className="rounded-lg border p-3"
          />

          <input
            type="text"
            value={filters.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="Фильтр по полному имени"
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
          <button
            onClick={resetFilters}
            className="rounded-lg bg-gray-200 px-4 py-2"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-stone-100 text-left">
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Логин</th>
              <th className="px-4 py-3">Кто изменил</th>
              <th className="px-4 py-3">Было</th>
              <th className="px-4 py-3">Стало</th>
            </tr>
          </thead>
          <tbody>
            {history.length ? (
              history.map((item) => (
                <tr key={item.id} className="border-t border-stone-200">
                  <td className="px-4 py-3">
                      {item.changed_at_formatted || "-"}
                  </td>
                  <td className="px-4 py-3">{item.target_username || "-"}</td>
                  <td className="px-4 py-3">{item.changed_by_username || "-"}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {item.old_full_name || "-"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {item.new_full_name || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-stone-500">
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