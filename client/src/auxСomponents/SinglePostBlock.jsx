const ROLE_LABELS = {
  admin: "Администратор",
  supply_manager: "Снабженец",
  default: "Пользователь",
};

const STATUS_LABELS = {
  undeclared: "Без подписи",
  active: "Активная",
  archived: "В архиве",
};

const STATUS_STYLES = {
  undeclared: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  archived: "bg-slate-200 text-slate-700 border-slate-300",
};

const UserInfoCard = ({ title, user, dateLabel, dateValue }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <div className="mt-3 space-y-2">
        <p className="text-base font-semibold text-slate-900">
          {user?.full_name || "Не указано"}
        </p>

        <p className="text-sm text-slate-600">
          @{user?.username || "unknown"}
        </p>

        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {ROLE_LABELS[user?.role] || user?.role_label || "Пользователь"}
        </span>

        {dateValue ? (
          <p className="pt-2 text-sm text-slate-500">
            {dateLabel}: <span className="font-medium text-slate-700">{dateValue}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
};

const RequestItemCard = ({ item, index }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Позиция #{index + 1}</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">
            {item?.name || "Без названия"}
          </h4>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          {item?.quantity} {item?.unit}
        </div>
      </div>

      {item?.description ? (
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
          {item.description}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
          Описание отсутствует
        </div>
      )}
    </div>
  );
};

export const SinglePostBlock = ({ data, onApprove }) => {
  const status = data?.status || "undeclared";
  const items = Array.isArray(data?.items) ? data.items : [];
  const createdBy = data?.created_by_user;
  const approvedBy = data?.approved_by_user;

  const canShowApproveButton =
    status === "undeclared" && Boolean(data?.canApprove) && typeof onApprove === "function";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-8 py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-xl bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-800">
                Заявка № {data?.id}
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Карточка заявки
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Подробная информация по заявке и её позициям
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-2xl border px-4 py-2 text-sm font-semibold ${
                  STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {STATUS_LABELS[status] || status}
              </span>

              {canShowApproveButton ? (
                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-600"
                >
                  {data?.actionButtonText || "Подписать"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-8 p-8">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Комментарий к заявке
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
                {data?.comment?.trim() || "Комментарий отсутствует"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sky-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Даты
                </h3>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-slate-500">Создана</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {data?.created_at_formatted || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-slate-500">Подписана</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {data?.approved_at_formatted || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-slate-500">Архивирована</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {data?.closed_at_formatted || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <UserInfoCard
              title="Автор заявки"
              user={createdBy}
              dateLabel="Дата создания"
              dateValue={data?.created_at_formatted}
            />

            {(status === "active" || status === "archived") ? (
              <UserInfoCard
                title="Кто подписал"
                user={approvedBy}
                dateLabel="Дата подписи"
                dateValue={data?.approved_at_formatted}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Подписание</p>
                <p className="mt-3 text-sm text-slate-400">
                  Заявка ещё не подписана
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Позиции заявки
                </h3>
              </div>

              <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Всего: {items.length}
              </span>
            </div>

            {items.length ? (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <RequestItemCard key={item?.id ?? index} item={item} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                В заявке пока нет позиций
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};