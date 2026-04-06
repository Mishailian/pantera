import { AddTag } from "./AddTag";
import { useGetTagsQuery } from "../../app/api/apiSlice";
import { createTags } from "../../creatFunctions/createTags";
import { progressCheck } from "../../progressCheck";
import { setTagsTable } from "../../app/auth/tagsSlice";
import { useUpdateObjectsTable } from "../../static/static";

export const TagList = () => {
  const tags = useGetTagsQuery();
  var updateTagsTable = useUpdateObjectsTable(setTagsTable);
  const callback = (tags) => createTags(tags);

  progressCheck(tags, updateTagsTable);
  const content = progressCheck(tags, callback);
  return (
    <div>
      <h1>tag list</h1>
      {content}
      <AddTag />
    </div>
  );
};
