import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetMyRequestsQuery,
  useGetProfileHistoryQuery,
  useGetDeletedRequestsQuery,
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

const CHANGE_TYPE_LABELS = {
  name: "Имя",
  phone: "Телефон",
  role: "Роль",
  password: "Пароль",
  deletion: "Удалён",
};

const CHANGE_BY_ROLE_LABELS = {
  self: "Сам пользователь",
  admin: "Администратор",
  it_department: "ОИТ",
  it_head: "Нач. ОИТ",
  supply_head: "Нач. снабжения",
};

const CHANGE_TYPE_STYLES = {
  name: "bg-blue-100 text-blue-700",
  phone: "bg-purple-100 text-purple-700",
  role: "bg-amber-100 text-amber-700",
  password: "bg-rose-100 text-rose-700",
  deletion: "bg-red-600 text-white",
};

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

const AccountHistoryTab = () => {
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

const MyRequestsTab = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading, isError } = useGetMyRequestsQuery();

  if (isLoading) return <div>Загрузка заявок...</div>;
  if (isError) return <div>Ошибка загрузки заявок</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Мои заявки</h2>
        <p className="mt-1 text-sm text-stone-500">История всех созданных вами заявок.</p>
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
              requests.map((req) => {
                const statusKey = req.status || "undeclared";
                return (
                  <tr key={req.id} className="border-t border-stone-200">
                    <td className="px-4 py-3 font-semibold">#{req.id}</td>
                    <td className="px-4 py-3">{req.created_at_formatted || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[statusKey] || "bg-stone-200 text-stone-800"}`}>
                        {STATUS_LABELS[statusKey] || "Неизвестно"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{req.items_count ?? req.items?.length ?? 0}</td>
                    <td className="max-w-[320px] truncate px-4 py-3 text-stone-600">{req.comment?.trim() || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/my-requests/${req.id}`)}
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

const DeletedRequestsTab = () => {
  const [expandedId, setExpandedId] = useState(null);
  const { data: deletedList = [], isLoading, isError } = useGetDeletedRequestsQuery();

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка загрузки удалённых заявок</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Удалённые заявки</h2>
        <p className="mt-1 text-sm text-stone-500">
          Все удалённые заявки с историей — кто, когда и по какой причине.
        </p>
      </div>

      {deletedList.length === 0 ? (
        <div className="rounded-lg bg-white px-6 py-10 text-center text-stone-500 shadow-sm">
          Нет удалённых заявок
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deletedList.map((rec) => {
            const snap = rec.snapshot || {};
            const isExpanded = expandedId === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border border-rose-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                      Заявка #{rec.original_id}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      Удалена: {rec.deleted_at_formatted || "-"}
                    </span>
                    {rec.deleted_by_user ? (
                      <span className="text-sm text-slate-500">
                        Кем: {rec.deleted_by_user.full_name || rec.deleted_by_user.number || "—"}
                        {rec.deleted_by_user.number ? ` (${rec.deleted_by_user.number})` : ""}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Кем: неизвестно</span>
                    )}
                    {rec.reason ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 ring-1 ring-amber-200">
                        Причина: {rec.reason}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Без причины</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">
                      Создана: {snap.created_at_formatted || "-"} •{" "}
                      {snap.created_by_user?.full_name || "Неизвестно"}
                      {snap.created_by_user?.role_label ? ` (${snap.created_by_user.role_label})` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      {isExpanded ? "Скрыть" : "Подробнее"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Статус на момент удаления</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{STATUS_LABELS[snap.status] || snap.status || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Кол-во позиций</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{snap.items_count ?? snap.items?.length ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Кто создал</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {snap.created_by_user?.full_name || "—"}
                          {snap.created_by_user?.number ? ` · ${snap.created_by_user.number}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Отдел</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{snap.created_by_user?.role_label || "—"}</p>
                      </div>
                    </div>

                    {snap.comment && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Цель покупки</p>
                        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{snap.comment}</p>
                      </div>
                    )}

                    {snap.items && snap.items.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Позиции заявки</p>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <th className="px-3 py-2">№</th>
                                <th className="px-3 py-2">Наименование</th>
                                <th className="px-3 py-2">Ед.</th>
                                <th className="px-3 py-2">Кол-во</th>
                                <th className="px-3 py-2">Срок</th>
                                <th className="px-3 py-2">Комментарий</th>
                              </tr>
                            </thead>
                            <tbody>
                              {snap.items.map((item, i) => (
                                <tr key={item.id || i} className="border-t border-slate-100">
                                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-pre-wrap">{item.name || "—"}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.unit || "—"}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.quantity ?? "—"}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.deadline || "—"}</td>
                                  <td className="px-3 py-2 text-slate-600 whitespace-pre-wrap">{item.description || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ProfileHistory = () => {
  const roles = useSelector((state) => state.auth.roles || []);

  const isAdmin = useMemo(() => roles.some((role) => role?.name === "admin"), [roles]);

  const canViewAccountHistory = useMemo(
    () => roles.some((role) =>
      ["admin", "supply_manager", "supply_head", "it_department", "it_head"].includes(role?.name)
    ),
    [roles]
  );

  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "requests" ? "bg-black text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"
          }`}
        >
          Мои заявки
        </button>

        {canViewAccountHistory && (
          <button
            type="button"
            onClick={() => setActiveTab("names")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "names" ? "bg-black text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            История изменений аккаунтов
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("deleted")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "deleted" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
            }`}
          >
            Удалённые заявки
          </button>
        )}
      </div>

      {activeTab === "requests" && <MyRequestsTab />}
      {activeTab === "names" && <AccountHistoryTab />}
      {activeTab === "deleted" && isAdmin && <DeletedRequestsTab />}
    </div>
  );
};
