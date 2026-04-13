import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    csrf_token: null,
    username: null,
    username_id: null,
    roles: [],
    isAuth: false,
    token: null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload.token;
      state.isAuth = action.payload.isAuth;
      state.csrf_token = action.payload.csrf_token ?? null;
      state.username = action.payload.username;
      state.roles = action.payload.roles || [];
      state.username_id = action.payload.username_id;
    },
    clearAuth: (state) => {
      state.csrf_token = null;
      state.username = null;
      state.username_id = null;
      state.roles = [];
      state.isAuth = false;
      state.token = null;
    },
  },
});

export const { setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;