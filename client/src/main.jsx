import ReactDOM from "react-dom/client";
import "./index.css";
import store, { persistor } from "./app/store";
import { Provider } from "react-redux";
import { Root } from "./routers/Root/Root";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PostsList } from "./routers/PostsList/PostsList";
import { Login } from "./app/auth/Login";
import { PersistGate } from "redux-persist/integration/react";
import { UserList } from "./routers/UserList/UserList";
import { SinglePost } from "./routers/Post/SinglePost";
import { AddPost } from "./routers/Post/AddPost";
import { AddUser } from "./routers/User/AddUser";
import { UserPage } from "./routers/User/UserPage";
import { TagList } from "./routers/Tags/TagList";
import { UndeclaretedList } from "./routers/UndeclaretedList/UndeclaretedList";
import { ArchiveList } from "./routers/ArchiveList/ArchiveList";
import { SingleUndeclaretedPost } from "./routers/UndeclaretedList/SingleUndeclaretedPost";
import { StrictMode } from "react";
import { SingleArchivedPost } from "./routers/ArchiveList/SingleArchivedPost";
import { RequireRoles } from "./routers/guards/RequireRoles";
import { Profile } from "./routers/User/Profile";           // ← ДОБАВИТЬ
import { ProfileHistory } from "./routers/User/ProfileHistory";  // ← ДОБАВИТЬ

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { path: "profile", element: <Profile /> },
      { 
        path: "profile-history",
        element: (
          <RequireRoles allowedRoles={["admin", "supplymanager"]}>
            <ProfileHistory />
          </RequireRoles>
        )
      },
      {
        path: "/undeclared",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <UndeclaretedList />
          </RequireRoles>
        ),
      },
      {
        path: "/archived",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <ArchiveList />
          </RequireRoles>
        ),
      },
      {
        path: "/archived/:postId",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <SingleArchivedPost />
          </RequireRoles>
        ),
      },
      {
        path: "/store",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <PostsList />
          </RequireRoles>
        ),
      },
      {
        path: "/store/:postId",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <SinglePost />
          </RequireRoles>
        ),
      },
      {
        path: "/undeclared/:postId",
        element: (
          <RequireRoles allowedRoles={["admin", "supply_manager"]}>
            <SingleUndeclaretedPost />
          </RequireRoles>
        ),
      },
      {
        path: "/users",
        element: <UserList />,
      },
      {
        path: "/users/:userId",
        element: <UserPage />,
      },
      {
        path: "/auth",
        element: <Login />,
      },
      {
        path: "/addPost",
        element: <AddPost />,
      },
      {
        path: "/addUser",
        element: <AddUser />,
      },
      {
        path: "/tagList",
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
