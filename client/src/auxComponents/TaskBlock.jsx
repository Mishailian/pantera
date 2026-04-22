import { useRef } from "react";
import { TasksInputFields } from "./TasksInputFields";

export const TaskBlock = ({ result, key, state, chengeState }) => {
  var ref = useRef();

  return (
    <div
      key={key}
      onMouseLeave={() => {
        ref.current = setTimeout(() => chengeState(true), 1000);
      }}
      onMouseEnter={() => clearTimeout(ref.current)}
    >
      <TasksInputFields
        name={key}
        data={state}
        eventFunc={() => {
          chengeState();
        }}
        eventFuncName={"test"}
      />
      <div>{result}</div>
    </div>
  );
};
