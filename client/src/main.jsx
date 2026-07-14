import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "./index.css";
import store, { persistor } from "./app/store";

import { Root } from "./routers/Root/Root";
import { Login } from "./app/auth/Login";

import { UserList } from "./routers/UserList/UserList";
import { AddPost } from "./routers/Post/AddPost";
import { TagList } from "./routers/Tags/TagList";
import { RequireRoles } from "./routers/guards/RequireRoles";
import { Profile } from "./routers/User/Profile";
import { ProfileHistory } from "./routers/User/ProfileHistory";
import { RequestsTabsPage } from "./routers/RequestsTabsPage";

// Подключаем наш новый универсальный компонент просмотра заявки
import { UniversalSinglePost } from "./routers/Post/UniversalSinglePost";


const REQUESTS_ALLOWED_ROLES = ["admin", "supply_manager", "supply_head", "rezo_department", "rezo_head"];

const RequestsTabRoute = ({ tab }) => (
  <RequireRoles allowedRoles={REQUESTS_ALLOWED_ROLES}>
    <RequestsTabsPage tab={tab} />
  </RequireRoles>
);


const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "profile", element: <Profile /> },
      { path: "profile-history", element: <ProfileHistory /> },
      
      // --- Списки заявок (вкладки) ---
      {
        path: "store",
        element: <RequestsTabRoute tab="store" />,
      },
      {
        path: "undeclared",
        element: <RequestsTabRoute tab="undeclared" />,
      },
      {
        path: "archived",
        element: <RequestsTabRoute tab="archived" />,
      },

      // --- Детальный просмотр заявки (Универсальный) ---
      {
        path: "my-requests/:postId",
        element: <UniversalSinglePost />, // Доступно обычному работяге без проверки ролей
      },
      {
        path: "store/:postId",
        element: (
          <RequireRoles allowedRoles={REQUESTS_ALLOWED_ROLES}>
            <UniversalSinglePost />
          </RequireRoles>
        ),
      },
      {
        path: "undeclared/:postId",
        element: (
          <RequireRoles allowedRoles={REQUESTS_ALLOWED_ROLES}>
            <UniversalSinglePost />
          </RequireRoles>
        ),
      },
      {
        path: "archived/:postId",
        element: (
          <RequireRoles allowedRoles={REQUESTS_ALLOWED_ROLES}>
            <UniversalSinglePost />
          </RequireRoles>
        ),
      },

      // --- Остальные маршруты ---
      {
        path: "users",
        element: (
          <RequireRoles allowedRoles={["admin", "it_department", "it_head", "supply_head"]}>
            <UserList />
          </RequireRoles>
        ),
      },
      {
        path: "auth",
        element: <Login />,
      },
      {
        path: "addPost",
        element: <AddPost />,
      },
      {
        path: "tagList",
        element: <TagList />,
      },
    ],
  },
]);


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </StrictMode>
);