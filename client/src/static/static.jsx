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
      addPost: "Добавить заявку",
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

export const STATUS_LABELS = {
  undeclared: "На рассмотрении",
  active: "В работе",
  archived: "В архиве",
};

export const STATUS_STYLES = {
  undeclared: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-800",
};

export const CHANGE_TYPE_LABELS = {
  name: "Имя",
  phone: "Телефон",
  role: "Роль",
  password: "Пароль",
  deletion: "Удалён",
};

export const CHANGE_BY_ROLE_LABELS = {
  self: "Сам пользователь",
  admin: "Администратор",
  it_department: "ОИТ",
  it_head: "Нач. ОИТ",
  supply_head: "Нач. снабжения",
};

export const CHANGE_TYPE_STYLES = {
  name: "bg-blue-100 text-blue-700",
  phone: "bg-purple-100 text-purple-700",
  role: "bg-amber-100 text-amber-700",
  password: "bg-rose-100 text-rose-700",
  deletion: "bg-red-600 text-white",
};

export const ROLE_LABELS = {
  supply_manager: "Отдел снабжения",
  rezo_department: "Отдел Резо",
  it_department: "ОИТ",
};

export const REQUEST_TYPE_LABELS = {
  registration: "Регистрация",
  role_change: "Смена роли",
};

export const STATUS_META = {
  archived: {
    label: "Архивная",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  active: {
    label: "Активная",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  undeclared: {
    label: "На рассмотрении",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
  },
};

export const ITEM_STATUS_META = {
  in_progress: {
    label: "В работе",
    badge: "bg-amber-100 text-amber-800",
    selectBadge:
      "bg-amber-50 text-amber-800 border-amber-200 focus:ring-amber-500/20 focus:border-amber-500",
  },
  on_payment: {
    label: "На оплате",
    badge: "bg-blue-100 text-blue-800",
    selectBadge:
      "bg-blue-50 text-blue-800 border-blue-200 focus:ring-blue-500/20 focus:border-blue-500",
  },

  in_manufacture: {
    label: "В производстве",
    badge: "bg-purple-100 text-purple-800",
    selectBadge:
      "bg-purple-50 text-purple-800 border-purple-200 focus:ring-purple-500/20 focus:border-purple-500",
  },

  on_the_way: {
    label: "В пути",
    badge: "bg-purple-100 text-purple-800",
    selectBadge:
      "bg-purple-50 text-purple-800 border-purple-200 focus:ring-purple-500/20 focus:border-purple-500",
  },

  done: {
    label: "Выполнено (На складе)",
    badge: "bg-emerald-100 text-emerald-800",
    selectBadge:
      "bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500",
  },
  rejected: {
    label: "Отказ",
    badge: "bg-rose-100 text-rose-800",
    selectBadge:
      "bg-rose-50 text-rose-800 border-rose-200 focus:ring-rose-500/20 focus:border-rose-500",
  },
};


