import { useDispatch, useSelector } from "react-redux";
import { WidthType } from "docx";

export var staticApi = () => {
  var username_id = useSelector((state) => state.auth.username_id);
  var is_superuser = useSelector((state) => state.auth.is_superuser);

  var obj = {
    paths: {
      users: "/users/",
      store: "/store/",
      undeclared: "/undeclared/",
      archived: "/archived/",
      approval: "/approval/",
      addPost: "/addPost/",
      tagList: "/tagList/",
    },
    names: {
      store: "Созданные заявки",
      archived: "Архив",
      undeclared: "Без подписи",
      approval: "Согласование",
      users: "Пользователи",
      addPost: "Сформировать заявку",
      tagList: "Роли",
    },

    document: {
      table: {
        main: {
          columnWidths: [450, 4700, 600, 600, 1425, 1425],
          headers: [
            "\u2116",
            "Наименование",
            "Ед",
            "Колл",
            "Планируемый срок приобретения",
            // "Фактический срок приобретения",
          ],
          cell: {
            width: {
              size: 3505,
              type: WidthType.AUTO,
            },
            height: {},
          },
        },
      },
    },
    structure: {
      addPost: {
        name: "test",
        about: null,
        data_dead_line: null,
        author: username_id,
      },
      addPosition: {
        //  это метаданные структур а не структуры
        title: "",
        units: null,
        quantity: 0,
        deadline: new Date(),
        isDone: false,
        tags: [],
        about: "",
      },
    },
  };
  return obj;
};
// надо провести сюда запрос по получению пользователь и включить хэш  это сейчас находиться в Login.js
export const useUpdateObjectsTable = ( setFunction,
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
