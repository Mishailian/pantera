import { useDispatch } from "react-redux";

export var staticApi = () => {
  var obj = {
    paths: {
      users: "/users/",
      store: "/store/",
      undeclared: "/undeclared/",
      archived: "/archived/",
      addPost: "/addPost/",
      tagList: "/tagList/",
    },
    names: {
      store: "Созданные заявки",
      archived: "Архив",
      undeclared: "Без подписи",
      users: "Пользователи",
      addPost: "Сформировать заявку",
      tagList: "Роли",
    },
  };
  return obj;
};

export const useUpdateObjectsTable = (
  setFunction,
  valueKey = "name",
  errorMessage = "ты не передал объекты в аргументы"
) => {
  const dispatch = useDispatch();

  const callBack = (objects = null) => {
    if (!objects) {
      alert(errorMessage);
      return;
    }

    const list = Array.isArray(objects) ? objects : Object.values(objects);

    const table = list.reduce((acc, object) => {
      if (object?.id != null) {
        acc[object.id] = object?.[valueKey] ?? "";
      }
      return acc;
    }, {});

    dispatch(setFunction(table));
  };

  return callBack;
};
