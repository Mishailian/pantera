import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetPostQuery,
  useDeclaredPostMutation,
} from "../../app/api/apiSlice";
import { SinglePostBlock } from "../../auxComponents/SinglePostBlock";
import { progressCheck } from "../../progressCheck";

export const UniversalSinglePost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Строго определяем контекст (откуда открыли заявку)
  let mode = "active";
  if (location.pathname.includes("/undeclared")) mode = "undeclared";
  else if (location.pathname.includes("/archived")) mode = "archived";
  else if (location.pathname.includes("/my-requests")) mode = "my-requests";

  const currentUserId = useSelector((state) => state.auth.username_id);
  const currentUserRoles = useSelector((state) => state.auth.roles || []);

  // Флаг админа (для точечных проверок внутри, если понадобятся)
  const isAdmin = currentUserRoles.some((role) =>
    (typeof role === "string" ? role : role?.name) === "admin"
  );

  const isSupplyManager = currentUserRoles.some((role) =>
    (typeof role === "string" ? role : role?.name) === "supply_manager"
  );

  // Универсальный запрос данных заявки
  const postObject = useGetPostQuery({ postId });
  const [declarePost] = useDeclaredPostMutation();

  // Владелец заявки может редактировать её содержимое, пока она без подписи
  const canEditOwn =
    mode === "my-requests" &&
    postObject?.data?.status === "undeclared" &&
    postObject?.data?.created_by_id === currentUserId;

  const handleApprove = async () => {
    try {
      await declarePost({
        postId,
        changed_by_id: currentUserId,
        comment: "Заявка переведена в active",
      }).unwrap();
      navigate("/store/");
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Не удалось перевести заявку в активные.");
    }
  };

  const content = progressCheck(
    {
      ...postObject,
      data: {
        ...postObject.data,
        postId,
        mode,
        isAdmin,
        // Если мы НЕ в истории личных заявок, значит мы смотрим заявку с полными правами
        canManage: mode !== "my-requests",
        isSupplyManager,
        canEditOwn,
      },
    },
    (data) => {
      return (
        <SinglePostBlock
          data={data}
          onApprove={mode === "undeclared" ? handleApprove : undefined}
        />
      );
    }
  );

  return <div>{content}</div>;
};