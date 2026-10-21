import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    onlineUsers: [],
    messages: [],
    selectedUser: null,
    conversations: [],
    unreadMessages: [],
  },
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload || [];
    },
    setMessages: (state, action) => {
      state.messages = action.payload || [];
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
      if (action.payload) {
        const selectedId = (action.payload._id || action.payload).toString();
        state.unreadMessages = (state.unreadMessages || []).filter((msg) => {
          const senderId = (msg.senderId?._id || msg.senderId)?.toString();
          return senderId !== selectedId;
        });
      }
    },
    setConversations: (state, action) => {
      state.conversations = action.payload || [];
    },
    addUnreadMessage: (state, action) => {
      const msg = action.payload;
      if (!msg) return;
      if (!state.unreadMessages) {
        state.unreadMessages = [];
      }
      const msgId = msg._id;
      const isDuplicate = state.unreadMessages.some(
        (m) =>
          (msgId && m._id === msgId) ||
          (m.senderId === msg.senderId && m.message === msg.message && m.createdAt === msg.createdAt)
      );
      if (!isDuplicate) {
        state.unreadMessages.unshift(msg);
      }
    },
    clearUnreadMessages: (state) => {
      state.unreadMessages = [];
    },
    appendMessage: (state, action) => {
      const msg = action.payload;
      if (msg) {
        state.messages.push(msg);
      }
    },
  },
});

export const {
  setOnlineUsers,
  setMessages,
  setSelectedUser,
  setConversations,
  addUnreadMessage,
  clearUnreadMessages,
  appendMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
