import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api/workspaces";

export const fetchWorkspaces = createAsyncThunk("workspace/fetchWorkspaces", async () => {
  const res = await axios.get(API, { withCredentials: true });
  return res.data.workspaces;
});

export const createWorkspace = createAsyncThunk("workspace/createWorkspace", async (data) => {
  const res = await axios.post(API, data, { withCredentials: true });
  return res.data.workspace;
});

export const updateWorkspace = createAsyncThunk("workspace/updateWorkspace", async ({ id, ...data }) => {
  const res = await axios.put(`${API}/${id}`, data, { withCredentials: true });
  return res.data.workspace;
});

export const deleteWorkspace = createAsyncThunk("workspace/deleteWorkspace", async (id) => {
  await axios.delete(`${API}/${id}`, { withCredentials: true });
  return id;
});

export const fetchMembers = createAsyncThunk("workspace/fetchMembers", async (workspaceId) => {
  const res = await axios.get(`${API}/${workspaceId}/members`, { withCredentials: true });
  return { workspaceId, members: res.data.members };
});

export const addMember = createAsyncThunk("workspace/addMember", async ({ workspaceId, userId }) => {
  const res = await axios.post(`${API}/${workspaceId}/members`, { userId }, { withCredentials: true });
  return { workspaceId, member: res.data.member };
});

export const removeMember = createAsyncThunk("workspace/removeMember", async ({ workspaceId, userId }) => {
  await axios.delete(`${API}/${workspaceId}/members/${userId}`, { withCredentials: true });
  return { workspaceId, userId };
});

export const fetchMessages = createAsyncThunk("workspace/fetchMessages", async ({ workspaceId, page = 1, limit = 50 }) => {
  const res = await axios.get(`${API}/${workspaceId}/messages?page=${page}&limit=${limit}`, { withCredentials: true });
  return { workspaceId, ...res.data };
});

export const sendMessage = createAsyncThunk("workspace/sendMessage", async ({ workspaceId, content }) => {
  const res = await axios.post(`${API}/${workspaceId}/messages`, { content }, { withCredentials: true });
  return { workspaceId, message: res.data.message };
});

export const editMessage = createAsyncThunk("workspace/editMessage", async ({ workspaceId, msgId, content }) => {
  const res = await axios.put(`${API}/${workspaceId}/messages/${msgId}`, { content }, { withCredentials: true });
  return { workspaceId, message: res.data.message };
});

export const deleteMessage = createAsyncThunk("workspace/deleteMessage", async ({ workspaceId, msgId, deleteFrom }) => {
  await axios.delete(`${API}/${workspaceId}/messages/${msgId}`, {
    data: { deleteFrom },
    withCredentials: true,
  });
  return { workspaceId, msgId, deleteFrom };
});

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    workspaces: [],
    members: {},
    messages: {},
    messagesTotal: {},
    loading: false,
  },
  reducers: {
    receiveMessage(state, action) {
      const { workspaceId, message } = action.payload;
      if (!state.messages[workspaceId]) state.messages[workspaceId] = [];
      if (!state.messages[workspaceId].some((m) => m.id === message.id)) {
        state.messages[workspaceId].push(message);
      }
    },
    receiveEditedMessage(state, action) {
      const { workspaceId, message } = action.payload;
      if (state.messages[workspaceId]) {
        const idx = state.messages[workspaceId].findIndex((m) => m.id === message.id);
        if (idx >= 0) state.messages[workspaceId][idx] = message;
      }
    },
    receiveDeletedMessage(state, action) {
      const { workspaceId, messageId } = action.payload;
      if (state.messages[workspaceId]) {
        state.messages[workspaceId] = state.messages[workspaceId].filter((m) => m.id !== messageId);
      }
    },
    receiveMemberAdded() {},
    receiveMemberRemoved(state, action) {
      const { workspaceId, userId } = action.payload;
      if (state.members[workspaceId]) {
        state.members[workspaceId] = state.members[workspaceId].filter((m) => m.userId !== userId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.fulfilled, (state, action) => { state.workspaces = action.payload; })
      .addCase(createWorkspace.fulfilled, (state, action) => { state.workspaces.push(action.payload); })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const idx = state.workspaces.findIndex((w) => w.id === action.payload.id);
        if (idx >= 0) state.workspaces[idx] = action.payload;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
        delete state.members[action.payload];
        delete state.messages[action.payload];
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members[action.payload.workspaceId] = action.payload.members;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        const { workspaceId, member } = action.payload;
        if (!state.members[workspaceId]) state.members[workspaceId] = [];
        state.members[workspaceId].push(member);
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const { workspaceId, userId } = action.payload;
        if (state.members[workspaceId]) {
          state.members[workspaceId] = state.members[workspaceId].filter((m) => m.userId !== userId);
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.workspaceId] = action.payload.messages;
        state.messagesTotal[action.payload.workspaceId] = action.payload.total;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { workspaceId, message } = action.payload;
        if (!state.messages[workspaceId]) state.messages[workspaceId] = [];
        if (!state.messages[workspaceId].some((m) => m.id === message.id)) {
          state.messages[workspaceId].push(message);
        }
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const { workspaceId, message } = action.payload;
        if (state.messages[workspaceId]) {
          const idx = state.messages[workspaceId].findIndex((m) => m.id === message.id);
          if (idx >= 0) state.messages[workspaceId][idx] = message;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { workspaceId, msgId } = action.payload;
        if (state.messages[workspaceId]) {
          state.messages[workspaceId] = state.messages[workspaceId].filter((m) => m.id !== msgId);
        }
      })
      .addMatcher(
        (action) => action.type.startsWith("workspace/") && action.type.endsWith("/pending"),
        (state) => { state.loading = true; }
      )
      .addMatcher(
        (action) => action.type.startsWith("workspace/") && (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")),
        (state) => { state.loading = false; }
      );
  },
});

export const { receiveMessage, receiveEditedMessage, receiveDeletedMessage, receiveMemberAdded, receiveMemberRemoved } = workspaceSlice.actions;
export default workspaceSlice.reducer;
