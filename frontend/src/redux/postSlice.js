import { createSlice } from "@reduxjs/toolkit";

const postSlice = createSlice({
  name: "post",
  initialState: {
    posts: [],
    selectedPost: null,
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },
    updatePostLikes: (state, action) => {
      const { postId, likes } = action.payload;
      state.posts = state.posts.map((p) =>
        p._id === postId ? { ...p, likes } : p
      );
      if (state.selectedPost?._id === postId) {
        state.selectedPost = { ...state.selectedPost, likes };
      }
    },
  },
});

export const { setPosts, setSelectedPost, updatePostLikes } = postSlice.actions;
export default postSlice.reducer;
