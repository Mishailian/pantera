import { TasksHeader } from "../forms/tasksHeader";

export var ApplicationBlock = (props) => {
  var { inputData, handleChange, listOfComponents } = props.data;
  return (
    <div>
      <label htmlFor="floatingTextarea2">Название</label>
      <div className="form-floating">
        <label
          className="form"
          type="name"
          defaultValue={"aa"}
          placeholder=""
          value={inputData?.name}
          onChange={handleChange}
          name="name"
          id="floatingTextarea2"
          style={{ height: "3em", width: "25%" }}
        />
      </div>
      <label htmlFor="floatingTextarea2">Описание</label>
      <TasksHeader />
      {listOfComponents}
    </div>
  );
};
