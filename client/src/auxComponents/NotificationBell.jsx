import {
  useGetRoleRequestsCountQuery,
  useGetRoleRequestsQuery,
  useReviewRoleRequestMutation,
} from "../app/api/apiSlice";

import { useState } from "react";

import { ROLE_LABELS, REQUEST_TYPE_LABELS } from "../static/static";


export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data: countData, refetch: refetchCount } = useGetRoleRequestsCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: requests = [], refetch: refetchList } = useGetRoleRequestsQuery(undefined, {
    skip: !open,
  });
  const [reviewRequest] = useReviewRoleRequestMutation();

  const count = countData?.count ?? 0;

  const handleReview = async (requestId, action) => {
    try {
      await reviewRequest({ requestId, action }).unwrap();
      refetchCount();
      refetchList();
    } catch (e) {
      alert(e?.data?.error || "Ошибка при обработке запроса");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Открыть уведомления"
        aria-expanded={open}
        className={`
        relative flex h-10 w-10 items-center justify-center
        rounded-xl border transition-all duration-200
        ${open
            ? "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          }
      `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {count > 0 && (
          <span
            className="
            absolute -right-1.5 -top-1.5
            flex h-5 min-w-5 items-center justify-center
            rounded-full bg-rose-600 px-1
            text-[10px] font-bold text-white
            ring-2 ring-white
          "
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div
            className="
            absolute left-full top-0 z-50 ml-4
            w-[380px] overflow-hidden
            rounded-2xl border border-slate-200
            bg-white shadow-2xl
          "
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Запросы на смену роли
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {count > 0
                    ? `Ожидают обработки: ${count}`
                    : "Новых запросов нет"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                flex h-8 w-8 items-center justify-center
                rounded-lg text-slate-400
                transition hover:bg-slate-100 hover:text-slate-700
              "
              >
                ×
              </button>
            </div>

            <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {requests.length ? (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="space-y-3 px-5 py-4"
                  >
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {req.user?.full_name || "—"}
                        </p>

                        <span
                          className={`
                          rounded-full px-2 py-0.5
                          text-[10px] font-semibold
                          ${req.request_type === "registration"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                            }
                        `}
                        >
                          {REQUEST_TYPE_LABELS[req.request_type] || req.request_type}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        {req.user?.number || "—"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {req.request_type === "registration"
                          ? "Хочет вступить в:"
                          : "Запрашивает роль:"}{" "}
                        <span className="font-semibold text-slate-700">
                          {ROLE_LABELS[req.requested_role] || req.requested_role}
                        </span>
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {req.created_at_formatted || "—"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(req.id, "approve")}
                        className="
                        flex-1 rounded-xl bg-emerald-600
                        py-2 text-xs font-semibold text-white
                        transition hover:bg-emerald-500
                        active:scale-[0.98]
                      "
                      >
                        Одобрить
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReview(req.id, "reject")}
                        className="
                        flex-1 rounded-xl bg-rose-600
                        py-2 text-xs font-semibold text-white
                        transition hover:bg-rose-500
                        active:scale-[0.98]
                      "
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <div className="text-sm font-medium text-slate-600">
                    Запросов нет
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    Новые запросы появятся здесь
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
