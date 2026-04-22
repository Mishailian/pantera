import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { PostForm } from "../forms/PostForm";
import { ChooseBlock } from "./ChooseBlock";
import { PostBlockButtons } from "./PostBlockButtons";
import { ChooseExecutor } from "./ChooseExecutor";

export const PostBlock = memo((props) => {
  const navigate = useNavigate();
  const is_superuser = useSelector((state) => state.auth.is_superuser);

  const {
    id,
    path,
    executor,
    chenge,
    fn,
    getUsersTable,
    alternativeView,
    name,
    date_create,
    status,
  } = props.data;

  const deletePost = async () => {
    await fn(id);
  };

  const callback = async (initialState) => {
    await chenge({
      initialState: { executor: initialState },
      postId: id,
    });
  };

  const { result, chengeState } = ChooseBlock(getUsersTable, callback);

  const buttons = PostBlockButtons(
    id,
    deletePost,
    navigate,
    is_superuser,
    path
  );

  const addStructures = alternativeView
    ? alternativeView(id)
    : ChooseExecutor(
        chengeState,
        getUsersTable?.[executor],
        result
      );

  return (
    <PostForm
      name={name}
      date_create={date_create}
      buttons={buttons}
      addStuctures={addStructures}
      status={status}
    />
  );
});
