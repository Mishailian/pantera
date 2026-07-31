import { useEffect } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useGetAllDepartmentRequestsQuery,
} from "../../app/api/apiSlice";

import {
  STATUS_LABELS,
  STATUS_STYLES,
} from "../../static/static";

import { Pagination } from "../Requests/Pagination";

export const AllRequestsTab = () => {
  const navigate = useNavigate();
  const { page: pageParam } = useParams();

  const parsedPage = Number.parseInt(
    pageParam,
    10
  );

  const pageNumber =
    Number.isInteger(parsedPage) &&
      parsedPage > 0
      ? parsedPage
      : 1;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetAllDepartmentRequestsQuery({
    page: pageNumber,
    per_page: 15,
    sort: "desc",
  });

  const requests = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(
    data?.pages ?? 1,
    1
  );

  useEffect(() => {
    const isValidPage =
      Number.isInteger(parsedPage) &&
      parsedPage > 0;

    if (!isValidPage) {
      navigate(
        "/profile-history/department/page/1",
        { replace: true }
      );
    }
  }, [parsedPage, navigate]);

  useEffect(() => {
    if (
      !isLoading &&
      !isFetching &&
      total > 0 &&
      pageNumber > totalPages
    ) {
      navigate(
        `/profile-history/department/page/${totalPages}`,
        { replace: true }
      );
    }
  }, [
    isLoading,
    isFetching,
    total,
    pageNumber,
    totalPages,
    navigate,
  ]);

  const goToPage = (nextPage) => {
    const safePage = Math.min(
      Math.max(nextPage, 1),
      totalPages
    );

    navigate(
      `/profile-history/department/page/${safePage}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Загрузка заявок...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-sm">
        <h2 className="font-bold text-rose-600">
          Ошибка загрузки заявок
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error?.data?.error ||
            "Не удалось получить список."}
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Заявки отдела
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Всего заявок отдела: {total}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
          Страница {pageNumber} из {totalPages}
        </div>
      </header>

      {isFetching ? (
        <div className="border-b border-blue-100 bg-blue-50 px-6 py-3 text-sm font-semibold text-blue-700">
          Обновление данных...
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-4">№</th>
              <th className="px-5 py-4">
                Дата создания
              </th>
              <th className="px-5 py-4">
                Создатель
              </th>
              <th className="px-5 py-4">
                Статус
              </th>
              <th className="px-5 py-4">
                Позиций
              </th>
              <th className="px-5 py-4">
                Комментарий
              </th>
              <th className="px-5 py-4 text-right">
                Действие
              </th>
            </tr>
          </thead>

          <tbody>
            {requests.length > 0 ? (
              requests.map((requestItem) => {
                const statusKey =
                  requestItem.status ||
                  "undeclared";

                const creator =
                  requestItem.created_by_user ||
                  requestItem.createdBy ||
                  null;

                return (
                  <tr
                    key={requestItem.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 font-black text-slate-900">
                      #{requestItem.id}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {requestItem.created_at_formatted ||
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">
                        {creator?.full_name ||
                          creator?.fullName ||
                          "—"}
                      </div>

                      <div className="mt-1 text-xs font-medium text-slate-400">
                        {creator?.number ||
                          "Номер не указан"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`
                          inline-flex items-center whitespace-nowrap
                          rounded-full px-3 py-1.5
                          text-xs font-bold
                          ${STATUS_STYLES[
                          statusKey
                          ] ||
                          "bg-slate-200 text-slate-800"
                          }
                        `}
                      >
                        {STATUS_LABELS[
                          statusKey
                        ] || "Неизвестно"}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-800">
                      {requestItem.items_count ??
                        requestItem.items?.length ??
                        0}
                    </td>

                    <td className="max-w-[320px] px-5 py-4">
                      <div className="truncate text-sm text-slate-500">
                        {requestItem.comment?.trim() ||
                          "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/my-requests/${requestItem.id}`
                          )
                        }
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-slate-500"
                >
                  В отделе пока нет заявок
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {requests.length > 0 ? (
        <div className="border-t border-slate-100 px-6 pb-4">
          <Pagination
            page={pageNumber}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      ) : null}
    </section>
  );
};
