export var UndeclaretedPostsBlock = (callBack) => {
  return (
    <>
      <button data-testid="_undeclaretedPostsBlock" onClick={() => callBack()}>
        задекларировать
      </button>
    </>
  );
};
