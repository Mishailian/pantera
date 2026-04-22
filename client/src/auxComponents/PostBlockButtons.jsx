export var PostBlockButtons = (id, dellete, navigate, is_superuser, path) => {
  return (
    <>
      <button
        className="dButton openB m-1 pt-0 pb-0 pl-6 pr-6 bg-white  before:outline-blueC z-10"
        onClick={() => navigate(`/${path}/${id}/`)}
      >
        <p className="relative z-20 block">перейти</p>
      </button>
      {is_superuser ? (
        <button
          className="dButton removeB bg-white m-1 pt-0 pb-0 pl-6 pr-6 z-10 "
          onClick={dellete}
        >
          <p className="relative z-20 block">удалить</p>
        </button>
      ) : null}
    </>
  );
};
