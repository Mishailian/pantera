import {
  useGetUndeclaredPostsQuery,
  useDeclaredPostMutation,
  useGetUndeclaredPostsCountQuery,
  useDeleteUndeclaredPostMutation,
} from "../../app/api/apiSlice";
import { createObjectsPage } from "../../creatFunctions/createObjectsPage";

export const UndeclaretedList = () => {
  const [declarePost] = useDeclaredPostMutation();

  const result = createObjectsPage({
    queryFunction: useGetUndeclaredPostsQuery,
    alternativeView: (postId) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          declarePost({ postId });
        }}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg"
      >
        Зарегистрировать
      </button>
    ),
    queryPostCount: useGetUndeclaredPostsCountQuery,
    chng: () => [],
    del: useDeleteUndeclaredPostMutation,
    path: "undeclared",
  });

  return <>{result}</>;
};
