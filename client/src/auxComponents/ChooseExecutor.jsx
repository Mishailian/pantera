export var ChooseExecutor = (chengeState, executor, result) => {
  return (
    <div className="ml-2 justify-self-end">
      {
        <div className="cursor-pointer" onClick={() => chengeState()}>
          {executor ?? "❌"}
        </div>
      }
      {result}
    </div>
  );
};
