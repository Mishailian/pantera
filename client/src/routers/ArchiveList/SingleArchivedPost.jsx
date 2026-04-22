import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useGetRequestQuery } from "../../app/api/apiSlice";
import { SinglePostBlock } from "../../auxComponents/SinglePostBlock";
import { progressCheck } from "../../progressCheck";


export const SingleArchivedPost = () => {
  const { postId } = useParams();
  const postObject = useGetRequestQuery(postId);
  const currentUserRoles = useSelector((state) => state.auth.roles || []);


  const canManage = currentUserRoles.some((role) =>
    ["admin", "supply_manager"].includes(role?.name)
  );


  const content = progressCheck(
    {
      ...postObject,
      data: {
        ...postObject.data,
        postId,
        mode: "archived",
        canManage,
      },
    },
    (data) => {
      return <SinglePostBlock data={data} />;
    }
  );


  return <div>{content}</div>;
};
