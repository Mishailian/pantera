import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetMyRequestsQuery,
  useGetProfileHistoryQuery,
} from "../../app/api/apiSlice";

const STATUS_LABELS = {
  undeclared: "На рассмотрении",
  active: "В работе",
  archived: "В архиве",
};

const STATUS_STYLES = {
  undeclared: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-800",
};

const NameHistoryTab = () => {
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

  if (isLoading) return <div>Загрузка истории имён...</div>;
  if (isError) return <div>Ошибка загрузки истории имён</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">История изменения имён</h2>

      <div className="rounded-lg bg-white p-4 shadow-sm">
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
                  <td className="px-4 py-3">{item.changed_at_formatted || "-"}</td>
                  <td className="px-4 py-3">{item.target_username || "-"}</td>
                  <td className="px-4 py-3">{item.changed_by_username || "-"}</td>
                  <td className="px-4 py-3 text-stone-500">{item.old_full_name || "-"}</td>
                  <td className="px-4 py-3 font-medium">{item.new_full_name || "-"}</td>
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

const MyRequestsTab = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading, isError } = useGetMyRequestsQuery();

  if (isLoading) return <div>Загрузка заявок...</div>;
  if (isError) return <div>Ошибка загрузки заявок</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Мои заявки</h2>
        <p className="mt-1 text-sm text-stone-500">
          История всех созданных вами заявок.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-stone-100 text-left">
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Дата создания</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Кол-во позиций</th>
              <th className="px-4 py-3">Комментарий</th>
              <th className="px-4 py-3 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {requests.length ? (
              requests.map((request) => {
                const statusKey = request.status || "undeclared";
                const statusLabel = STATUS_LABELS[statusKey] || "Неизвестно";
                const statusStyle =
                  STATUS_STYLES[statusKey] || "bg-stone-200 text-stone-800";

                return (
                  <tr key={request.id} className="border-t border-stone-200">
                    <td className="px-4 py-3 font-semibold">#{request.id}</td>
                    <td className="px-4 py-3">
                      {request.created_at_formatted || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.items_count ?? request.items?.length ?? 0}
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3 text-stone-600">
                      {request.comment?.trim() || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/store/${request.id}`)}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Открыть заявку
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-stone-500">
                  У вас пока нет созданных заявок
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ProfileHistory = () => {
  const roles = useSelector((state) => state.auth.roles || []);

  const canViewNameHistory = useMemo(() => {
    return roles.some((role) =>
      ["admin", "supply_manager"].includes(role?.name)
    );
  }, [roles]);

  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "requests"
              ? "bg-black text-white"
              : "bg-stone-200 text-stone-700 hover:bg-stone-300"
          }`}
        >
          Мои заявки
        </button>

        {canViewNameHistory ? (
          <button
            type="button"
            onClick={() => setActiveTab("names")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "names"
                ? "bg-black text-white"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            История имён
          </button>
        ) : null}
      </div>

      {activeTab === "requests" ? <MyRequestsTab /> : <NameHistoryTab />}
    </div>
  );
};