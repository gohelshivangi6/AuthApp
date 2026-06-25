import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as chatService from "../../services/chatService";

export const fetchUsers = createAsyncThunk("chat/fetchUsers", async () => {
  const res = await chatService.getUsers();
  return res.data.users;
});

export const createConversation = createAsyncThunk("chat/createConversation", async (participantId) => {
  const res = await chatService.createConversation(participantId);
  return res.data.conversation;
});

export const fetchConversations = createAsyncThunk("chat/fetchConversations", async () => {
  const res = await chatService.getConversations();
  return res.data.conversations;
});

export const fetchMessages = createAsyncThunk("chat/fetchMessages", async ({ conversationId, page = 1, limit = 50 }) => {
  const res = await chatService.getMessages(conversationId, { page, limit });
  return { conversationId, ...res.data };
});

export const sendMessage = createAsyncThunk("chat/sendMessage", async ({ conversationId, content }) => {
  const res = await chatService.sendMessage(conversationId, content);
  return { conversationId, message: res.data.message };
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    users: [],
    conversations: [],
    messages: {},
    messagesTotal: {},
    loadingUsers: false,
    loadingConversations: false,
    loadingMessages: false,
    sendingMessage: false,
  },
  reducers: {
    receiveDirectMessage(state, action) {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) state.messages[conversationId] = [];
      if (!state.messages[conversationId].some((m) => m.id === message.id)) {
        state.messages[conversationId].push(message);
      }
    },
    clearChat(state) {
      state.messages = {};
      state.messagesTotal = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => { state.users = action.payload; })
      .addCase(fetchConversations.fulfilled, (state, action) => { state.conversations = action.payload; })
      .addCase(createConversation.fulfilled, (state, action) => {
        const exists = state.conversations.find((c) => c.id === action.payload.id);
        if (!exists) state.conversations.unshift(action.payload);
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.conversationId] = action.payload.messages;
        state.messagesTotal[action.payload.conversationId] = action.payload.total;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) state.messages[conversationId] = [];
        if (!state.messages[conversationId].some((m) => m.id === message.id)) {
          state.messages[conversationId].push(message);
        }
      })
      .addMatcher(
        (action) => action.type.startsWith("chat/") && action.type.endsWith("/pending"),
        (state, action) => {
          if (action.type.includes("fetchUsers")) state.loadingUsers = true;
          if (action.type.includes("fetchConversations")) state.loadingConversations = true;
          if (action.type.includes("fetchMessages")) state.loadingMessages = true;
          if (action.type.includes("sendMessage")) state.sendingMessage = true;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("chat/") && (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")),
        (state, action) => {
          if (action.type.includes("fetchUsers")) state.loadingUsers = false;
          if (action.type.includes("fetchConversations")) state.loadingConversations = false;
          if (action.type.includes("fetchMessages")) state.loadingMessages = false;
          if (action.type.includes("sendMessage")) state.sendingMessage = false;
        }
      );
  },
});

export const { receiveDirectMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
