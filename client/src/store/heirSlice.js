import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  heir: null,
};

const heirSlice = createSlice({
  name: "heir",
  initialState,
  reducers: {
    loginHeir(state, action) {
      state.isLoggedIn = true;
      state.heir = action.payload;
    },
    logoutHeir(state) {
      state.isLoggedIn = false;
      state.heir = null;
    },
    updateHeir(state, action) {
      if (state.heir) {
        state.heir = { ...state.heir, ...action.payload };
      }
    },
  },
});

export const { loginHeir, logoutHeir, updateHeir } = heirSlice.actions;
export default heirSlice.reducer;
