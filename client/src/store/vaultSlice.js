// store/vaultSlice.js
import { createSlice } from "@reduxjs/toolkit";

const vaultSlice = createSlice({
  name: "vault",
  initialState: {
    vaultKey: null,
  },
  reducers: {
    setVaultKey: (state, action) => {
      state.vaultKey = action.payload;
    },
    clearVaultKey: (state) => {
      state.vaultKey = null;
    },
  },
});

export const { setVaultKey, clearVaultKey } = vaultSlice.actions;
export default vaultSlice.reducer;
