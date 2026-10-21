import { createSlice } from "@reduxjs/toolkit";

const rtnSlice = createSlice({
  name: "realTimeNotification",
  initialState: {
    likeNotification: [],
  },
  reducers: {
    setLikeNotification: (state, action) => {
      if (action.payload.type === "dislike") {
        state.likeNotification = state.likeNotification.filter(
          (item) => item.userId !== action.payload.userId || item.postId !== action.payload.postId
        );
      } else {
        const isDuplicate = state.likeNotification.some(
          (item) =>
            item.userId === action.payload.userId &&
            item.type === action.payload.type &&
            item.postId === action.payload.postId &&
            item.commentText === action.payload.commentText &&
            item.messageText === action.payload.messageText
        );
        if (!isDuplicate) {
          state.likeNotification.unshift(action.payload);
        }
      }
    },
    clearLikeNotification: (state) => {
      state.likeNotification = [];
    },
  },
});

export const { setLikeNotification, clearLikeNotification } = rtnSlice.actions;
export default rtnSlice.reducer;
