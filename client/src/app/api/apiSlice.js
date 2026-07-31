import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";


const buildQueryParams = (
  params = {}
) => {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  return searchParams.toString();
};


export const apiSlice =
  createApi({
    reducerPath: "api",

    baseQuery: fetchBaseQuery({
      baseUrl:
        import.meta.env
          .VITE_API_URL,

      prepareHeaders: (
        headers,
        {
          getState,
        }
      ) => {
        const token =
          getState()
            ?.auth
            ?.token;

        if (token) {
          headers.set(
            "Authorization",
            `Token ${token}`
          );
        }

        return headers;
      },

      credentials:
        "include",
    }),

    refetchOnFocus: true,
    refetchOnReconnect: true,

    keepUnusedDataFor: 5,

    tagTypes: [
      "REQUESTS",
      "REQUEST",
      "USERS",
      "USER",
      "AUTH",
      "ROLES",
      "PROFILE_HISTORY",
      "TEMPLATES",
      "ROLE_REQUESTS",
    ],

    endpoints:
      (builder) => ({
        authentication:
          builder.mutation({
            invalidatesTags: [
              "AUTH",
            ],

            query: ({
              initialState,
            }) => ({
              url:
                "/auth/login",
              method:
                "POST",
              body:
                initialState,
            }),
          }),

        register:
          builder.mutation({
            invalidatesTags: [
              "AUTH",
              "USERS",
            ],

            query:
              (payload) => ({
                url:
                  "/auth/register",
                method:
                  "POST",
                body:
                  payload,
              }),
          }),

        getRoles:
          builder.query({
            providesTags: [
              "ROLES",
            ],

            query: () => ({
              url:
                "/roles/",
              method:
                "GET",
            }),
          }),

        addRole:
          builder.mutation({
            invalidatesTags: [
              "ROLES",
            ],

            query:
              (payload) => ({
                url:
                  "/roles/",
                method:
                  "POST",
                body:
                  payload,
              }),
          }),

        getUsers:
          builder.query({
            providesTags: [
              "USERS",
            ],

            query: () => ({
              url:
                "/users/",
              method:
                "GET",
            }),
          }),

        updateUserRoles:
          builder.mutation({
            invalidatesTags: [
              "USERS",
            ],

            query: ({
              userId,
              role,
            }) => ({
              url:
                `/users/${userId}/roles`,
              method:
                "PATCH",
              body: {
                role,
              },
            }),
          }),

        updateUser:
          builder.mutation({
            invalidatesTags: [
              "USERS",
              "PROFILE_HISTORY",
            ],

            query: ({
              userId,
              full_name,
              number,
              password,
            }) => ({
              url:
                `/users/${userId}`,
              method:
                "PATCH",
              body: {
                full_name,
                number,
                password,
              },
            }),
          }),

        deleteUser:
          builder.mutation({
            invalidatesTags: [
              "USERS",
            ],

            query:
              (userId) => ({
                url:
                  `/users/${userId}`,
                method:
                  "DELETE",
              }),
          }),

        assignHead:
          builder.mutation({
            invalidatesTags: [
              "USERS",
            ],

            query:
              (userId) => ({
                url:
                  `/users/${userId}/head`,
                method:
                  "POST",
              }),
          }),

        removeHead:
          builder.mutation({
            invalidatesTags: [
              "USERS",
            ],

            query:
              (userId) => ({
                url:
                  `/users/${userId}/head`,
                method:
                  "DELETE",
              }),
          }),

        getCurrentUser:
          builder.query({
            query: () =>
              "users/me",

            providesTags: [
              "USER",
            ],
          }),

        updateCurrentUser:
          builder.mutation({
            query: ({
              full_name,
              role_name,
              number,
            }) => ({
              url:
                "users/me",
              method:
                "PATCH",
              body: {
                full_name,
                role_name,
                number,
              },
            }),

            invalidatesTags: [
              "USER",
              "AUTH",
            ],
          }),

        getProfileHistory:
          builder.query({
            query:
              (
                params = {}
              ) => {
                const queryString =
                  buildQueryParams(
                    params
                  );

                return {
                  url:
                    `users/profile-history${queryString
                      ? `?${queryString}`
                      : ""
                    }`,
                  method:
                    "GET",
                };
              },

            providesTags: [
              "PROFILE_HISTORY",
            ],
          }),

        getMyRequests:
          builder.query({
            query: ({
              page = 1,
              per_page = 15,
              status,
              sort = "desc",
              search,
              search_field,
            } = {}) => {
              const queryString =
                buildQueryParams({
                  page,
                  per_page,
                  status,
                  sort,
                  search,
                  search_field,
                });

              return {
                url:
                  `users/me/requests${queryString
                    ? `?${queryString}`
                    : ""
                  }`,
                method:
                  "GET",
              };
            },

            providesTags: [
              "REQUESTS",
            ],
          }),

        getAllDepartmentRequests:
          builder.query({
            query: ({
              page = 1,
              per_page = 15,
              status,
              sort = "desc",
              search,
              search_field,
            } = {}) => {
              const queryString =
                buildQueryParams({
                  page,
                  per_page,
                  status,
                  sort,
                  search,
                  search_field,
                });

              return {
                url:
                  `users/me/department/requests${queryString
                    ? `?${queryString}`
                    : ""
                  }`,
                method:
                  "GET",
              };
            },

            providesTags: [
              "REQUESTS",
            ],
          }),

        getRoleRequests:
          builder.query({
            providesTags: [
              "ROLE_REQUESTS",
            ],

            query: () => ({
              url:
                "/role-requests/",
              method:
                "GET",
            }),
          }),

        getRoleRequestsCount:
          builder.query({
            providesTags: [
              "ROLE_REQUESTS",
            ],

            query: () => ({
              url:
                "/role-requests/count",
              method:
                "GET",
            }),
          }),

        getMyRoleRequests:
          builder.query({
            providesTags: [
              "ROLE_REQUESTS",
            ],

            query: () => ({
              url:
                "/role-requests/my",
              method:
                "GET",
            }),
          }),

        createRoleRequest:
          builder.mutation({
            invalidatesTags: [
              "ROLE_REQUESTS",
            ],

            query:
              (
                requested_role
              ) => ({
                url:
                  "/role-requests/",
                method:
                  "POST",
                body: {
                  requested_role,
                },
              }),
          }),

        reviewRoleRequest:
          builder.mutation({
            invalidatesTags: [
              "ROLE_REQUESTS",
              "USERS",
            ],

            query: ({
              requestId,
              action,
            }) => ({
              url:
                `/role-requests/${requestId}`,
              method:
                "PATCH",
              body: {
                action,
              },
            }),
          }),


        getActiveRequests: builder.query({
          providesTags: ["REQUESTS"],

          query: ({
            page = 1,
            per_page = 15,
            sort = "desc",
            search,
            search_field,
            department,
            assigned_to_id,
          } = {}) => {
            const queryString = buildQueryParams({
              status: "active",
              page,
              per_page,
              sort,
              search,
              search_field,
              department,
              assigned_to_id,
            });

            return {
              url: `/requests/?${queryString}`,
              method: "GET",
            };
          },
        }),

        getUndeclaredRequests: builder.query({
          providesTags: ["REQUESTS"],

          query: ({
            page = 1,
            per_page = 15,
            sort = "desc",
            search,
            search_field,
            department,
            assigned_to_id,
          } = {}) => {
            const queryString = buildQueryParams({
              status: "undeclared",
              page,
              per_page,
              sort,
              search,
              search_field,
              department,
              assigned_to_id,
            });

            return {
              url: `/requests/?${queryString}`,
              method: "GET",
            };
          },
        }),

        getArchivedRequests: builder.query({
          providesTags: ["REQUESTS"],

          query: ({
            page = 1,
            per_page = 15,
            sort = "desc",
            search,
            search_field,
            department,
            assigned_to_id,
          } = {}) => {
            const queryString = buildQueryParams({
              status: "archived",
              page,
              per_page,
              sort,
              search,
              search_field,
              department,
              assigned_to_id,
            });

            return {
              url: `/requests/?${queryString}`,
              method: "GET",
            };
          },
        }),



        getUndeclaredRequests: builder.query({
          providesTags: [
            "REQUESTS",
          ],

          query: ({
            page = 1,
            per_page = 15,
            sort = "desc",
            search,
            search_field,
            department,
            assigned_to_id,
          } = {}) => {
            const queryString =
              buildQueryParams({
                status: "undeclared",
                page,
                per_page,
                sort,
                search,
                search_field,
                department,
                assigned_to_id,
              });

            return {
              url:
                `/requests/?${queryString}`,
              method:
                "GET",
            };
          },
        }),



        getArchivedRequests: builder.query({
          providesTags: [
            "REQUESTS",
          ],

          query: ({
            page = 1,
            per_page = 15,
            sort = "desc",
            search,
            search_field,
            department,
            assigned_to_id,
          } = {}) => {
            const queryString =
              buildQueryParams({
                status: "archived",
                page,
                per_page,
                sort,
                search,
                search_field,
                department,
                assigned_to_id,
              });

            return {
              url:
                `/requests/?${queryString}`,
              method:
                "GET",
            };
          },
        }),



        getDeletedRequests:
          builder.query({
            providesTags: [
              "REQUESTS",
            ],

            query: () => ({
              url:
                "/requests/deleted/",
              method:
                "GET",
            }),
          }),

        getPost:
          builder.query({
            providesTags: (
              result,
              error,
              arg
            ) => [
                {
                  type:
                    "REQUEST",
                  id:
                    arg?.postId,
                },
              ],

            query: ({
              postId,
            }) => ({
              url:
                `/requests/${postId}`,
              method:
                "GET",
            }),
          }),

        addPost:
          builder.mutation({
            invalidatesTags: [
              "REQUESTS",
            ],

            query: ({
              initialState,
            }) => ({
              url:
                "/requests/",
              method:
                "POST",
              body:
                initialState,
            }),
          }),

        updateRequest:
          builder.mutation({
            invalidatesTags: (
              result,
              error,
              {
                requestId,
              }
            ) => [
                "REQUESTS",
                {
                  type:
                    "REQUEST",
                  id:
                    requestId,
                },
              ],

            query: ({
              requestId,
              ...payload
            }) => ({
              url:
                `/requests/${requestId}`,
              method:
                "PATCH",
              body:
                payload,
            }),
          }),

        changeRequestStatus:
          builder.mutation({
            invalidatesTags: (
              result,
              error,
              {
                requestId,
              }
            ) => [
                "REQUESTS",
                {
                  type:
                    "REQUEST",
                  id:
                    requestId,
                },
              ],

            query: ({
              requestId,
              status,
              changed_by_id,
              comment,
            }) => ({
              url:
                `/requests/${requestId}/status`,
              method:
                "PATCH",
              body: {
                status,
                changed_by_id,
                comment,
              },
            }),
          }),

        declaredPost:
          builder.mutation({
            invalidatesTags: [
              "REQUESTS",
            ],

            query: ({
              postId,
              changed_by_id,
              comment,
            }) => ({
              url:
                `/requests/${postId}/status`,
              method:
                "PATCH",
              body: {
                status:
                  "active",
                changed_by_id,
                comment,
              },
            }),
          }),

        deleteRequest:
          builder.mutation({
            invalidatesTags: [
              "REQUESTS",
            ],

            query: ({
              requestId,
              deletedById,
              reason,
            } = {}) => ({
              url:
                `/requests/${requestId}`,
              method:
                "DELETE",
              body: {
                deleted_by_id:
                  deletedById,
                reason:
                  reason ||
                  null,
              },
            }),
          }),

        updateRequestItem:
          builder.mutation({
            invalidatesTags: [
              "REQUESTS",
              "REQUEST",
            ],

            query: ({
              itemId,
              ...payload
            }) => ({
              url:
                `/requests/items/${itemId}`,
              method:
                "PATCH",
              body:
                payload,
            }),
          }),

        getTemplates:
          builder.query({
            providesTags: [
              "TEMPLATES",
            ],

            query: () => ({
              url:
                "/templates/",
              method:
                "GET",
            }),
          }),

        addTemplate:
          builder.mutation({
            invalidatesTags: [
              "TEMPLATES",
            ],

            query:
              (payload) => ({
                url:
                  "/templates/",
                method:
                  "POST",
                body:
                  payload,
              }),
          }),

        deleteTemplate:
          builder.mutation({
            invalidatesTags: [
              "TEMPLATES",
            ],

            query:
              (
                templateId
              ) => ({
                url:
                  `/templates/${templateId}`,
                method:
                  "DELETE",
              }),
          }),
      }),
  });


export const {
  useAuthenticationMutation,
  useRegisterMutation,
  useGetRolesQuery,
  useAddRoleMutation,
  useGetUsersQuery,
  useUpdateUserRolesMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAssignHeadMutation,
  useRemoveHeadMutation,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useGetProfileHistoryQuery,
  useGetMyRequestsQuery,
  useGetAllDepartmentRequestsQuery,
  useGetRoleRequestsQuery,
  useGetRoleRequestsCountQuery,
  useGetMyRoleRequestsQuery,
  useCreateRoleRequestMutation,
  useReviewRoleRequestMutation,
  useGetActiveRequestsQuery,
  useGetUndeclaredRequestsQuery,
  useGetArchivedRequestsQuery,
  useGetDeletedRequestsQuery,
  useGetPostQuery,
  useAddPostMutation,
  useUpdateRequestMutation,
  useChangeRequestStatusMutation,
  useDeclaredPostMutation,
  useDeleteRequestMutation,
  useUpdateRequestItemMutation,
  useGetTemplatesQuery,
  useAddTemplateMutation,
  useDeleteTemplateMutation,
} = apiSlice;


export const useGetRegistrationRolesQuery =
  apiSlice.endpoints
    .getRoles
    .useQuery;
