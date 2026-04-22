import { ChooseBlock } from "./ChooseBlock";

export const tagsPickerBlock = (tagsTable, tags, callBack) => {
  var ob = {};
  for (let [key, value] of Object.entries(tagsTable)) {
    if (tags.includes(value))
      ob[key] = <div style={{ color: "black" }}>{value}</div>;
    else ob[key] = <div style={{ color: "red" }}>{value}</div>;
  }
  let { result, chengeState } = ChooseBlock(ob, callBack);
  return { result, chengeState };
};
