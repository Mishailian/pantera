import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetPostQuery,
  useDeclaredPostMutation,
  useChangeRequestStatusMutation,
  useDeleteRequestMutation,
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
  else if (location.pathname.includes("/approval")) mode = "approval";
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

  const isDirectorApproval = currentUserRoles.some((role) =>
    (typeof role === "string" ? role : role?.name) === "director_approval"
  );

  // На "Согласовании" управлять может только админ/гендир, снабжение там только читает.
  // На остальных вкладках — как и раньше, админ/снабжение, гендир там только читает.
  const canApprove = isAdmin || isDirectorApproval;
  const canManage =
    mode === "my-requests"
      ? false
      : mode === "approval"
      ? canApprove
      : isAdmin || isSupplyManager;

  // Полную карточку заявки (создатель, даты, кто одобрил и т.д.) видят все,
  // кто попал сюда не через "Мои заявки" — включая гендира в режиме только чтения
  const canSeeFullDetails = mode !== "my-requests";

  // Универсальный запрос данных заявки
  const postObject = useGetPostQuery({ postId });
  const [declarePost] = useDeclaredPostMutation();
  const [changeRequestStatus] = useChangeRequestStatusMutation();
  const [deleteRequest] = useDeleteRequestMutation();

  const handleApprove = async () => {
    try {
      await declarePost({
        postId,
        changed_by_id: currentUserId,
        comment: "Заявка отправлена на согласование",
      }).unwrap();
      navigate("/undeclared/");
    } catch (error) {
      console.error("Failed to send request to approval:", error);
      alert("Не удалось отправить заявку на согласование.");
    }
  };

  const handleApproveByDirector = async () => {
    try {
      await changeRequestStatus({
        requestId: postId,
        status: "active",
        changed_by_id: currentUserId,
        comment: "Заявка согласована",
      }).unwrap();
      navigate("/approval/");
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Не удалось согласовать заявку.");
    }
  };

  const handleRejectByDirector = async () => {
    if (!confirm("Отклонить и полностью удалить заявку?")) return;

    try {
      await deleteRequest(postId).unwrap();
      navigate("/approval/");
    } catch (error) {
      console.error("Failed to reject request:", error);
      alert("Не удалось отклонить заявку.");
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
        canManage,
        canSeeFullDetails,
        isSupplyManager,
        isDirectorApproval,
      },
    },
    (data) => {
      return (
        <SinglePostBlock
          data={data}
          onApprove={
            mode === "undeclared"
              ? handleApprove
              : mode === "approval" && canApprove
              ? handleApproveByDirector
              : undefined
          }
          onReject={mode === "approval" && canApprove ? handleRejectByDirector : undefined}
        />
      );
    }
  );

  return <div>{content}</div>;
};