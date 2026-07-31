import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";


const buildPageList = (
  currentPage,
  totalPages
) => {
  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis-right",
      totalPages,
    ];
  }

  if (
    currentPage >=
    totalPages - 3
  ) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
};


export const Pagination = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageList(
    page,
    totalPages
  );

  return (
    <nav
      aria-label="Навигация по страницам"
      className="
        flex flex-col gap-3
        sm:flex-row sm:items-center
        sm:justify-between
      "
    >
      <div className="text-sm font-semibold text-slate-500">
        Страница{" "}
        <span className="font-black text-slate-900">
          {page}
        </span>{" "}
        из{" "}
        <span className="font-black text-slate-900">
          {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() =>
            onPageChange(page - 1)
          }
          className="
            inline-flex h-10 w-10 items-center
            justify-center rounded-xl
            border border-slate-200 bg-white
            text-slate-600 transition
            hover:border-slate-300
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-35
          "
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((pageItem) => {
          if (
            typeof pageItem === "string"
          ) {
            return (
              <span
                key={pageItem}
                className="
                  flex h-10 w-8 items-center
                  justify-center text-sm
                  font-black text-slate-400
                "
              >
                …
              </span>
            );
          }

          const isActive =
            pageItem === page;

          return (
            <button
              key={pageItem}
              type="button"
              onClick={() =>
                onPageChange(pageItem)
              }
              className={`
                inline-flex h-10 min-w-10
                items-center justify-center
                rounded-xl px-3 text-sm
                font-black transition
                ${isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }
              `}
            >
              {pageItem}
            </button>
          );
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() =>
            onPageChange(page + 1)
          }
          className="
            inline-flex h-10 w-10 items-center
            justify-center rounded-xl
            border border-slate-200 bg-white
            text-slate-600 transition
            hover:border-slate-300
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-35
          "
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
