import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const buildQueryParams = (params) => {
  let result = "";
  for (let key in params) {
    result += `${key}=${params[key]}&`;
  }
  result = result.slice(0, -1);
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
    prepareHeaders: (headers, { getState }) => {
      console.log(getState());
      const token = getState()?.auth?.token;
      if (token) {
        headers.set("Authorization", `Token ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["POSTS", "POST", "USESRS", "USER", "UNDECLARED", "TAGS"],
  endpoints: (builder) => ({
    getArhive: builder.query({
      query: () => "/archive/",
    }),
    getPosts: builder.query({
      providesTags: ["POSTS"],
      query: ({ page }) => {
        page = page ?? "";
        let url = "/store/";
        if (page) url = url + `?page=${page}`;

        return {
          url: url,
          method: "Get",
        };
      },
    }),
    getPostsCount: builder.query({
      providesTags: ["POSTS"],
      query: () => "/store/?count=1",
    }),

    getUndeclaredPostsCount: builder.query({
      providesTags: ["UNDECLARED"],
      query: () => "/undeclared/?count=1",
    }),

    getPostsFilteredCount: builder.query({
      providesTags: ["POSTS"],
      query: (exId) => `/store/?ex_count=${exId}`,
    }),

    getUndeclaredPosts: builder.query({
      providesTags: ["UNDECLARED"],
      query: ({ page }) => {
        page = page ?? "";
        let url = "/undeclared/";
        if (page) url = url + `?page=${page}`;

        return {
          url: url,
          method: "Get",
        };
      },
    }),
    getPost: builder.query({
      providesTags: ["POST"],
      invalidatesTags: ["TAGS"],
      query: ({ postId }) => ({
        url: `/store/${postId}/`,
        method: "GET",
      }),
    }),
    getUndeclaredPost: builder.query({
      providesTags: ["UNDECLARED"],
      query: ({ postId }) => ({
        url: `/undeclared/${postId}/`,
        method: "GET",
      }),
    }),
    getUsers: builder.query({
      query: () => "/users/",
    }),
    getUser: builder.query({
      providesTags: ["USER"],
      query: (userId) => ({
        url: `/users/${userId}/`,
        method: "GET",
      }),
    }),
    getUsersDB: builder.query({
      query: () => ({
        url: `/users/?get_exdb=true`,
        method: "GET",
      }),
    }),
    getFilterPosts: builder.query({
      providesTags: ["POSTS"],
      query: (params) => ({
        url: `/store/?${buildQueryParams(params)}`,
        method: "GET",
      }),
    }),
    getTags: builder.query({
      providesTags: ["TAGS"],
      query: () => "/tags/",
    }),

    declaredPost: builder.mutation({
      invalidatesTags: ["POSTS", "UNDECLARED"],
      query: ({ postId }) => ({
        url: `/undeclared/?declared=${postId}`,
        method: "GET",
      }),
    }),
    chengeTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: ({ initialState, tagId }) => ({
        url: `/tags/${tagId}/`,
        method: "PUT",
        body: initialState,
      }),
    }),
    chengePost: builder.mutation({
      invalidatesTags: ["POST", "POSTS"],
      query: ({ initialState, postId }) => {
        console.log({ body: initialState });
        return {
          url: `/store/${postId}/`,
          method: "PATCH",
          body: initialState,
        };
      },
    }),

    authentication: builder.mutation({
      query: ({ initialState }) => ({
        url: "/token/",
        body: initialState,
        method: "POST",
      }),
    }),

    deleteTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: (tagId) => ({ url: `/tags/${tagId}/`, method: "DELETE" }),
    }),
    deletePost: builder.mutation({
      invalidatesTags: ["POSTS"],
      query: (postId) => ({
        url: `/store/${postId}/`,
        method: "DELETE",
      }),
    }),

    deleteUndeclaredPost: builder.mutation({
      invalidatesTags: ["UNDECLARED"],
      query: (postId) => ({
        url: `/undeclared/${postId}/`,
        method: "DELETE",
      }),
    }),

    addPost: builder.mutation({
      invalidatesTags: ["UNDECLARED"],
      query: ({ initialState }) => {
        console.log(initialState);
        return {
          url: "/undeclared/",
          body: initialState,
          method: "POST",
        };
      },
    }),
    addTag: builder.mutation({
      invalidatesTags: ["TAGS"],
      query: ({ initialState }) => ({
        url: "/tags/",
        body: initialState,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetArhiveQuery,
  useAuthenticationMutation,
  useGetPostsQuery,
  useGetPostsCountQuery,
  useGetUndeclaredPostsCountQuery,
  useGetPostsFilteredCountQuery,
  useGetUndeclaredPostsQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useGetUsersDBQuery,
  useGetPostQuery,
  useGetUndeclaredPostQuery,
  useGetTagsQuery,
  useDeclaredPostMutation,
  useChengeTagMutation,
  useGetFilterPostsQuery,
  useChengePostMutation,
  useDeleteTagMutation,
  useDeletePostMutation,
  useDeleteUndeclaredPostMutation,
  useAddPostMutation,
  useAddTagMutation,
} = apiSlice;
