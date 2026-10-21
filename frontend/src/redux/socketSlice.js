import { createSlice } from "@reduxjs/toolkit";

// Note: socket instance itself has circular references and functions that are not serializable,
// but we provide setSocket and disconnect helpers for app-level socket sharing.
const socketSlice = createSlice({
  name: "socketio",
  initialState: {
    socket: null,
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
  },
});

export const { setSocket } = socketSlice.actions;
export default socketSlice.reducer;
