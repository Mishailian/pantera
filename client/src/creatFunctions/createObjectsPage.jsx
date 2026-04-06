import { useFilter } from "../hooks/useFilter/useFilter";
import { createObjects } from "./createObjects";
import { progressCheck } from "../progressCheck";
import { createPaginationControl } from "./createPaginationControl";
import { useSelector } from "react-redux";
import { PostBlock } from "../auxСomponents/PostBlock";

export const createObjectsPage = (props) => {
  const { currentPage, PaginationControl } = createPaginationControl({
    queryFn: props.queryPostCount,
    queryParams: props.queryParams,
  });

  const [changePost] = props.chng();
  const [deletePost] = props.del();

  const usersTable = useSelector((state) => state.users.usersTable);
  const { fillterJsx, fillter } = useFilter();

  const objPosts = props.queryFunction({
    ...props.queryParams,
    page: currentPage,
  });

  const callBack = (data) => {
    const filtered = fillter(data);

    return createObjects(filtered, PostBlock, {
      getUsersTable: usersTable,
      fn: deletePost,
      alternativeView: props.alternativeView,
      chenge: changePost,
      path: props.path ?? "store",
    });
  };

  const content = progressCheck(objPosts, callBack);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                Список заявок
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Просмотр, фильтрация и управление заявками.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            {fillterJsx}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {content}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              {PaginationControl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
