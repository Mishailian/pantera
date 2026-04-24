import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useGetPostQuery } from "../../app/api/apiSlice";
import { SinglePostBlock } from "../../auxComponents/SinglePostBlock";
import { progressCheck } from "../../progressCheck";

export const SinglePost = () => {
  const { postId } = useParams();
  const postObject = useGetPostQuery({ postId });
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
        mode: "active",
        canManage,
      },
    },
    (data) => {
      return <SinglePostBlock data={data} />;
    }
  );

  return <div>{content}</div>;
};
// export const SinglePost = () => {
//   var content;
//   const [aboutLines, setAboutline] = useState();
//   let tagsTable = useSelector((state) => state.tags.tagsTable);
//   let inComplete = false;
//   let listOfComponents = [];
//   const s = staticApi();
//   const is_superuser = useSelector((state) => state.auth.is_superuser);
//   const { inputData, setFormData, handleChange, handleSubmit, setData } =
//     useInputCheck();
//   const { postId } = useParams();
//   const postObject = useGetPostQuery({ postId });
//   const [chPost] = useChengePostMutation();
//   useEffect(() => {
//     content = progressCheck(
//       {
//         ...postObject,
//         data: { ...postObject.data, is_superuser, postId },
//       },
//       (data) => {
//         inComplete = true;
//         return data;
//       }
//     );
//   }, []);

//   useEffect(() => {
//     try {
//       setAboutline(JSON.parse(content.about));
//     } catch {}
//   }, [inComplete]);

//   if (aboutLines) {
//     for (let [key, _] of Object.entries(aboutLines)) {
//       let callBack = (id) => {
//         let result = tagsTable[id];
//         let listOfTags = [...aboutLines[key].tags];
//         if (listOfTags.includes(result))
//           listOfTags = listOfTags.filter((el) => el !== result);
//         else listOfTags.push(result);
//         setAboutline((state) => ({
//           ...state,
//           [key]: { ...state[key], tags: [...listOfTags] },
//         }));
//       };
//       let { result, chengeState } = s.structure.tagsPickerBlock(
//         tagsTable,
//         aboutLines[key].tags,
//         callBack
//       );

//       listOfComponents.push(
//         s.structure.taskBlock({ result, key, state: aboutLines, chengeState })
//       );
//     }
//   }
//   let Comp = s.structure.singlePostBlock({
//     inputData: inputData.formData,
//     handleChange,
//     listOfComponents,
//   });
//   console.log(aboutLines);
//   return <div>{Comp}</div>;
// };
