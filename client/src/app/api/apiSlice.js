import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const buildQueryParams = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  return searchParams.toString();
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost/api/v1",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set("Authorization", `Token ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["REQUESTS", "REQUEST", "USERS", "USER", "TAGS", "AUTH", "ROLES", "PROFILE_HISTORY"],
  endpoints: (builder) => ({
    login: builder.mutation({
      invalidatesTags: ["AUTH"],
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getRoles: builder.query({
      providesTags: ["ROLES"],
      query: () => ({
        url: "/roles/",
        method: "GET",
      }),
    }),

    addRole: builder.mutation({
      invalidatesTags: ["ROLES"],
      query: (payload) => ({
        url: "/roles/",
        method: "POST",
        body: payload,
      }),
    }),

    register: builder.mutation({
      invalidatesTags: ["AUTH", "USERS"],
      query: (payload) => ({
        url: "/auth/register",
        method: "POST",
        body: payload,
      }),
    }),
    getRegistrationRoles: builder.query({
      providesTags: ["ROLES"],
      query: () => ({
        url: "/auth/roles",
        method: "GET",
      }),
    }),

    getUsers: builder.query({
      providesTags: ["USERS"],
      query: () => ({
        url: "/users/",
        method: "GET",
      }),
    }),

    getUsersDB: builder.query({
      providesTags: ["USERS"],
      query: () => ({
        url: "/users/",
        method: "GET",
      }),
    }),

    getUser: builder.query({
      providesTags: (result, error, userId) => [{ type: "USER", id: userId }],
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "GET",
      }),
    }),

    updateUserRoles: builder.mutation({
      invalidatesTags: ["USERS"],
      query: ({ userId, role }) => ({
        url: `/users/${userId}/roles`,
        method: "PATCH",
        body: { role },
      }),
    }),

    getTags: builder.query({
      providesTags: ["TAGS"],
      query: () => ({
        url: "/tags/",
        method: "GET",
      }),
    }),

    getTag: builder.query({
      providesTags: (result, error, tagId) => [{ type: "TAGS", id: tagId }],
      query: (tagId) => ({
        url: `/tags/${tagId}`,
        method: "GET",
      }),
    }),

    addTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: (payload) => ({
        url: "/tags/",
        method: "POST",
        body: payload,
      }),
    }),

    updateTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: ({ tagId, ...payload }) => ({
        url: `/tags/${tagId}`,
        method: "PATCH",
        body: payload,
      }),
    }),

    deleteTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: (tagId) => ({
        url: `/tags/${tagId}`,
        method: "DELETE",
      }),
    }),

    getRequests: builder.query({
      providesTags: ["REQUESTS"],
      query: (params = {}) => {
        const queryString = buildQueryParams(params);
        return {
          url: `/requests/${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),

    getRequest: builder.query({
      providesTags: (result, error, requestId) => [{ type: "REQUEST", id: requestId }],
      query: (requestId) => ({
        url: `/requests/${requestId}`,
        method: "GET",
      }),
    }),

    addRequest: builder.mutation({
      invalidatesTags: ["REQUESTS"],
      query: (payload) => ({
        url: "/requests/",
        method: "POST",
        body: payload,
      }),
    }),

    updateRequest: builder.mutation({
      invalidatesTags: (result, error, { requestId }) => [
        "REQUESTS",
        { type: "REQUEST", id: requestId },
      ],
      query: ({ requestId, ...payload }) => ({
        url: `/requests/${requestId}`,
        method: "PATCH",
        body: payload,
      }),
    }),

    changeRequestStatus: builder.mutation({
      invalidatesTags: (result, error, { requestId }) => [
        "REQUESTS",
        { type: "REQUEST", id: requestId },
      ],
      query: ({ requestId, status, changed_by_id, comment }) => ({
        url: `/requests/${requestId}/status`,
        method: "PATCH",
        body: { status, changed_by_id, comment },
      }),
    }),

    deleteRequest: builder.mutation({
      invalidatesTags: ["REQUESTS"],
      query: (requestId) => ({
        url: `/requests/${requestId}`,
        method: "DELETE",
      }),
    }),

    addRequestItem: builder.mutation({
      invalidatesTags: (result, error, { requestId }) => [
        "REQUESTS",
        { type: "REQUEST", id: requestId },
      ],
      query: ({ requestId, ...payload }) => ({
        url: `/requests/${requestId}/items`,
        method: "POST",
        body: payload,
      }),
    }),

    updateRequestItem: builder.mutation({
      invalidatesTags: ["REQUESTS", "REQUEST"],
      query: ({ itemId, ...payload }) => ({
        url: `/requests/items/${itemId}`,
        method: "PATCH",
        body: payload,
      }),
    }),

    deleteRequestItem: builder.mutation({
      invalidatesTags: ["REQUESTS", "REQUEST"],
      query: (itemId) => ({
        url: `/requests/items/${itemId}`,
        method: "DELETE",
      }),
    }),

    getUndeclaredRequests: builder.query({
      providesTags: ["REQUESTS"],
      query: ({ page } = {}) => {
        const queryString = buildQueryParams({ status: "undeclared", page });
        return { url: `/requests/?${queryString}`, method: "GET" };
      },
    }),

    getActiveRequests: builder.query({
      providesTags: ["REQUESTS"],
      query: ({ page } = {}) => {
        const queryString = buildQueryParams({ status: "active", page });
        return { url: `/requests/?${queryString}`, method: "GET" };
      },
    }),

    getArchivedRequests: builder.query({
      providesTags: ["REQUESTS"],
      query: ({ page } = {}) => {
        const queryString = buildQueryParams({ status: "archived", page });
        return { url: `/requests/?${queryString}`, method: "GET" };
      },
    }),

    getPostsCount: builder.query({
      providesTags: ["REQUESTS"],
      query: () => ({ url: "/requests/?count=1&status=active", method: "GET" }),
    }),

    getUndeclaredPostsCount: builder.query({
      providesTags: ["REQUESTS"],
      query: () => ({ url: "/requests/?count=1&status=undeclared", method: "GET" }),
    }),

    getPostsFilteredCount: builder.query({
      providesTags: ["REQUESTS"],
      query: (exId) => ({
        url: `/requests/?count=1&status=active&assigned_to_id=${exId}`,
        method: "GET",
      }),
    }),

    getArhive: builder.query({
      providesTags: ["REQUESTS"],
      query: () => ({ url: "/requests/?status=archived", method: "GET" }),
    }),

    getPosts: builder.query({
      providesTags: ["REQUESTS"],
      query: ({ page } = {}) => {
        const queryString = buildQueryParams({ status: "active", page });
        return { url: `/requests/?${queryString}`, method: "GET" };
      },
    }),

    getUndeclaredPosts: builder.query({
      providesTags: ["REQUESTS"],
      query: ({ page } = {}) => {
        const queryString = buildQueryParams({ status: "undeclared", page });
        return { url: `/requests/?${queryString}`, method: "GET" };
      },
    }),

    getPost: builder.query({
      providesTags: (result, error, arg) => [{ type: "REQUEST", id: arg?.postId }],
      query: ({ postId }) => ({ url: `/requests/${postId}`, method: "GET" }),
    }),

    getUndeclaredPost: builder.query({
      providesTags: (result, error, arg) => [{ type: "REQUEST", id: arg?.postId }],
      query: ({ postId }) => ({ url: `/requests/${postId}`, method: "GET" }),
    }),

    getFilterPosts: builder.query({
      providesTags: ["REQUESTS"],
      query: (params = {}) => {
        const queryString = buildQueryParams({ ...params, status: "active" });
        return { url: `/requests/?${queryString}`, method: "GET" };
      },
    }),
    // GET /users/me
    getCurrentUser: builder.query({
      query: () => 'users/me',
      providesTags: ['USER']
    }),

    // PATCH /users/me
    updateCurrentUser: builder.mutation({
      query: ({ full_name, role_name }) => ({
        url: "users/me",
        method: "PATCH",
        body: { full_name, role_name },
      }),
      invalidatesTags: ["USER", "AUTH"],
    }),

    // GET /users/profile-history (protected)
    getProfileHistory: builder.query({
      query: (params = {}) => {
        const queryString = buildQueryParams(params);
        return {
          url: `users/profile-history${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["PROFILE_HISTORY"],
    }),

    declaredPost: builder.mutation({
      invalidatesTags: ["REQUESTS"],
      query: ({ postId, changed_by_id, comment }) => ({
        url: `/requests/${postId}/status`,
        method: "PATCH",
        body: { status: "active", changed_by_id, comment },
      }),
    }),

    chengeTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: ({ initialState, tagId }) => ({
        url: `/tags/${tagId}`,
        method: "PATCH",
        body: initialState,
      }),
    }),

    chengePost: builder.mutation({
      invalidatesTags: (result, error, { postId }) => [
        "REQUESTS",
        { type: "REQUEST", id: postId },
      ],
      query: ({ initialState, postId }) => ({
        url: `/requests/${postId}`,
        method: "PATCH",
        body: initialState,
      }),
    }),

    authentication: builder.mutation({
      invalidatesTags: ["AUTH"],
      query: ({ initialState }) => ({
        url: "/auth/login",
        method: "POST",
        body: initialState,
      }),
    }),

    deletePost: builder.mutation({
      invalidatesTags: ["REQUESTS"],
      query: (postId) => ({ url: `/requests/${postId}`, method: "DELETE" }),
    }),

    deleteUndeclaredPost: builder.mutation({
      invalidatesTags: ["REQUESTS"],
      query: (postId) => ({ url: `/requests/${postId}`, method: "DELETE" }),
    }),

    addPost: builder.mutation({
      invalidatesTags: ["REQUESTS"],
      query: ({ initialState }) => ({
        url: "/requests/",
        method: "POST",
        body: initialState,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetRegistrationRolesQuery,
  useGetUsersQuery,
  useGetUsersDBQuery,
  useGetUserQuery,
  useUpdateUserRolesMutation,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useGetProfileHistoryQuery,
  useGetRolesQuery,
  useAddRoleMutation,

  useGetTagsQuery,
  useGetTagQuery,
  useAddTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,

  useGetRequestsQuery,
  useGetRequestQuery,
  useAddRequestMutation,
  useUpdateRequestMutation,
  useChangeRequestStatusMutation,
  useDeleteRequestMutation,

  useAddRequestItemMutation,
  useUpdateRequestItemMutation,
  useDeleteRequestItemMutation,

  useGetUndeclaredRequestsQuery,
  useGetActiveRequestsQuery,
  useGetArchivedRequestsQuery,

  useGetPostsCountQuery,
  useGetUndeclaredPostsCountQuery,
  useGetPostsFilteredCountQuery,

  useGetArhiveQuery,
  useAuthenticationMutation,
  useGetPostsQuery,
  useGetUndeclaredPostsQuery,
  useGetPostQuery,
  useGetUndeclaredPostQuery,
  useDeclaredPostMutation,
  useGetFilterPostsQuery,
  useChengeTagMutation,
  useChengePostMutation,
  useDeletePostMutation,
  useDeleteUndeclaredPostMutation,
  useAddPostMutation,
} = apiSlice;