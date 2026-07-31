import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useSelector } from "react-redux";

import {
  useChangeRequestStatusMutation,
  useDeclaredPostMutation,
  useGetPostQuery,
} from "../../app/api/apiSlice";

import { SinglePostBlock } from "../../auxComponents/SinglePostBlock";
import { progressCheck } from "../../progressCheck";


export const UniversalSinglePost = ({
  mode,
}) => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const currentUserId = useSelector(
    (state) => state.auth.username_id
  );

  const currentUserRoles = useSelector(
    (state) => state.auth.roles || []
  );

  const hasRole = (roleName) => {
    return currentUserRoles.some((role) => {
      const currentRoleName =
        typeof role === "string"
          ? role
          : role?.name;

      return currentRoleName === roleName;
    });
  };

  const isAdmin = hasRole("admin");

  const isSupplyManager =
    hasRole("supply_manager");

  const isSupplyHead =
    hasRole("supply_head");

  const canSupplyEdit =
    isAdmin ||
    isSupplyManager ||
    isSupplyHead;

  const postObject =
    useGetPostQuery({
      postId,
    });

  const [declarePost] =
    useDeclaredPostMutation();

  const [changeStatus] =
    useChangeRequestStatusMutation();

  const requestData = postObject?.data;

  const isOwner =
    requestData?.created_by_id != null &&
    Number(requestData.created_by_id) ===
    Number(currentUserId);

  const canAuthorEdit =
    isOwner &&
    requestData?.status === "undeclared";

  const canEditRequest =
    canSupplyEdit ||
    canAuthorEdit;

  const canManage =
    mode !== "my-requests";

  const handleApprove = async () => {
    try {
      await declarePost({
        postId,
        changed_by_id: currentUserId,
        comment:
          "Заявка переведена в active",
      }).unwrap();

      navigate("/store/page/1");
    } catch (error) {
      console.error(
        "Failed to approve request:",
        error
      );

      alert(
        error?.data?.error ||
        "Не удалось перевести заявку в активные."
      );
    }
  };

  const handleArchive = async () => {
    try {
      await changeStatus({
        requestId: postId,
        status: "archived",
        changed_by_id: currentUserId,
      }).unwrap();

      navigate("/archived/page/1");
    } catch (error) {
      console.error(
        "Failed to archive request:",
        error
      );

      alert(
        error?.data?.error ||
        "Не удалось архивировать заявку."
      );
    }
  };

  const content = progressCheck(
    {
      ...postObject,

      data: {
        ...requestData,

        postId,
        mode,

        isAdmin,
        isSupplyManager,
        isSupplyHead,

        canManage,
        canEditRequest,
      },
    },

    (data) => (
      <SinglePostBlock
        data={data}
        onApprove={
          mode === "undeclared"
            ? handleApprove
            : undefined
        }
        onArchive={
          mode === "active"
            ? handleArchive
            : undefined
        }
      />
    )
  );

  return <>{content}</>;
};
