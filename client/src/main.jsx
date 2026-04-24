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
import { SinglePost } from "./routers/Post/SinglePost";
import { AddPost } from "./routers/Post/AddPost";
import { AddUser } from "./routers/User/AddUser";
import { UserPage } from "./routers/User/UserPage";
import { TagList } from "./routers/Tags/TagList";
import { SingleUndeclaretedPost } from "./routers/UndeclaretedList/SingleUndeclaretedPost";
import { SingleArchivedPost } from "./routers/ArchiveList/SingleArchivedPost";
import { RequireRoles } from "./routers/guards/RequireRoles";
import { Profile } from "./routers/User/Profile";
import { ProfileHistory } from "./routers/User/ProfileHistory";
import { RequestsTabsPage } from "./routers/RequestsTabsPage";

const RequestsTabRoute = ({ tab }) => (
  <RequireRoles allowedRoles={["admin", "supply_manager"]}>
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

      {
        path: "store/:postId",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <SinglePost />
          </RequireRoles>
        ),
      },
      {
        path: "undeclared/:postId",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <SingleUndeclaretedPost />
          </RequireRoles>
        ),
      },
      {
        path: "archived/:postId",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <SingleArchivedPost />
          </RequireRoles>
        ),
      },

      {
        path: "users",
        element: <UserList />,
      },
      {
        path: "users/:userId",
        element: <UserPage />,
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
        path: "addUser",
        element: <AddUser />,
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