import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetUndeclaredPostQuery,
  useDeclaredPostMutation,
} from "../../app/api/apiSlice";
import { SinglePostBlock } from "../../auxComponents/SinglePostBlock";
import { progressCheck } from "../../progressCheck";

export const SingleUndeclaretedPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const postObject = useGetUndeclaredPostQuery({ postId });
  const currentUserId = useSelector((state) => state.auth.username_id);
  const currentUserRoles = useSelector((state) => state.auth.roles || []);

  const canApprove = currentUserRoles.some((role) =>
    ["admin", "supply_manager"].includes(role?.name)
  );

  const [declarePost] = useDeclaredPostMutation();

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
        mode: "undeclared",
        canApprove,
        actionButtonText: "Подписать заявку",
      },
    },
    (data) => {
      return (
        <SinglePostBlock
          data={data}
          onApprove={handleApprove}
        />
      );
    }
  );

  return <div>{content}</div>;
};