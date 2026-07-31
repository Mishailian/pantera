import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { MyRequestsTab } from "./routers/User/MyRequestTab";
import { AllRequestsTab } from "./routers/User/AllRequestTab";
import { DeletedRequestsTab } from "./routers/User/DeletedRequestsTab";
import { AccountHistoryTab } from "./routers/User/AccountHistiryTab";

import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import "./index.css";

import store, {
  persistor,
} from "./app/store";

import { Login } from "./app/auth/Login";

import { Root } from "./routers/Root/Root";

import { Profile } from "./routers/User/Profile";
import { ProfileHistory } from "./routers/User/ProfileHistory";

import { UserList } from "./routers/UserList/UserList";
import { TagList } from "./routers/Tags/TagList";

import { AddPost } from "./routers/Post/AddPost";

import { ActiveSinglePostPage } from "./routers/Post/ActiveSinglePostPage";
import { ArchivedSinglePostPage } from "./routers/Post/ArchivedSinglePostPage";
import { MySinglePostPage } from "./routers/Post/MySinglePostPage";
import { UndeclaredSinglePostPage } from "./routers/Post/UndeclaredSinglePostPage";

import { StorePage } from "./routers/Requests/StorePage";
import { UndeclaredPage } from "./routers/Requests/UndeclaredPage";
import { ArchivedPage } from "./routers/Requests/ArchivedPage";

import { RequireRoles } from "./routers/guards/RequireRoles";


const REQUESTS_ALLOWED_ROLES = [
  "admin",
  "supply_manager",
  "supply_head",
  "rezo_department",
  "rezo_head",
];


const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,

    children: [
      {
        index: true,
        element: (
          <Navigate
            to="/profile"
            replace
          />
        ),
      },

      {
        path: "profile",
        element: <Profile />,
      },

      {
        path: "profile-history",
        element: <ProfileHistory />,

        children: [
          {
            index: true,
            element: (
              <Navigate
                to="/profile-history/department/page/1"
                replace
              />
            ),
          },

          {
            path: "department/page/:page",
            element: <AllRequestsTab />,
          },

          {
            path: "my/page/:page",
            element: <MyRequestsTab />,
          },

          {
            path: "accounts/page/:page",
            element: <AccountHistoryTab />,
          },

          {
            path: "deleted/page/:page",
            element: (
              <RequireRoles
                allowedRoles={["admin"]}
              >
                <DeletedRequestsTab />
              </RequireRoles>
            ),
          },
        ],
      },
      /*
       * Подписанные заявки.
       */
      {
        path: "store",
        element: (
          <Navigate
            to="/store/page/1"
            replace
          />
        ),
      },

      {
        path: "store/page/:page",
        element: (
          <RequireRoles
            allowedRoles={
              REQUESTS_ALLOWED_ROLES
            }
          >
            <StorePage />
          </RequireRoles>
        ),
      },

      /*
       * Заявки без подписи.
       */
      {
        path: "undeclared",
        element: (
          <Navigate
            to="/undeclared/page/1"
            replace
          />
        ),
      },

      {
        path: "undeclared/page/:page",
        element: (
          <RequireRoles
            allowedRoles={
              REQUESTS_ALLOWED_ROLES
            }
          >
            <UndeclaredPage />
          </RequireRoles>
        ),
      },

      /*
       * Архивные заявки.
       */
      {
        path: "archived",
        element: (
          <Navigate
            to="/archived/page/1"
            replace
          />
        ),
      },

      {
        path: "archived/page/:page",
        element: (
          <RequireRoles
            allowedRoles={
              REQUESTS_ALLOWED_ROLES
            }
          >
            <ArchivedPage />
          </RequireRoles>
        ),
      },

      /*
       * Детальные страницы заявок.
       */
      {
        path: "my-requests/:postId",
        element: <MySinglePostPage />,
      },

      {
        path: "store/:postId",
        element: (
          <RequireRoles
            allowedRoles={
              REQUESTS_ALLOWED_ROLES
            }
          >
            <ActiveSinglePostPage />
          </RequireRoles>
        ),
      },

      {
        path: "undeclared/:postId",
        element: (
          <RequireRoles
            allowedRoles={
              REQUESTS_ALLOWED_ROLES
            }
          >
            <UndeclaredSinglePostPage />
          </RequireRoles>
        ),
      },

      {
        path: "archived/:postId",
        element: (
          <RequireRoles
            allowedRoles={
              REQUESTS_ALLOWED_ROLES
            }
          >
            <ArchivedSinglePostPage />
          </RequireRoles>
        ),
      },

      /*
       * Остальные страницы.
       */
      {
        path: "users",
        element: (
          <RequireRoles
            allowedRoles={[
              "admin",
              "it_department",
              "it_head",
              "supply_head",
            ]}
          >
            <UserList />
          </RequireRoles>
        ),
      },

      {
        path: "addPost",
        element: <AddPost />,
      },

      {
        path: "tagList",
        element: (
          <RequireRoles
            allowedRoles={[
              "admin",
            ]}
          >
            <TagList />
          </RequireRoles>
        ),
      },
    ],
  },

  {
    path: "/auth",
    element: <Login />,
  },

  {
    path: "*",
    element: (
      <Navigate
        to="/profile"
        replace
      />
    ),
  },
]);


const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
      >
        <RouterProvider
          router={router}
        />
      </PersistGate>
    </Provider>
  </StrictMode>
);
