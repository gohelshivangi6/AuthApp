import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchDashboardData = createAsyncThunk("dashboard/fetchData", async () => {
  const res = await axios.get("http://localhost:5000/api/dashboard", {
    withCredentials: true,
  });
  return res.data;
});

export const fetchSectionPermissions = createAsyncThunk("dashboard/fetchSectionPermissions", async () => {
  const res = await axios.get("http://localhost:5000/api/dashboard/section-permissions", {
    withCredentials: true,
  });
  return res.data.permissions;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    departments: [],
    widgets: [],
    sectionPermissions: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSectionPermissions(state, action) {
      state.sectionPermissions = action.payload;
    },
    upsertSectionPermission(state, action) {
      const perm = action.payload;
      const idx = state.sectionPermissions.findIndex(
        (p) => p.targetId === perm.targetId
      );
      if (idx >= 0) state.sectionPermissions[idx] = perm;
      else state.sectionPermissions.push(perm);
    },
    removeSectionPermission(state, action) {
      state.sectionPermissions = state.sectionPermissions.filter(
        (p) => p.targetId !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.departments || [];
        state.widgets = action.payload.widgets || [];
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchSectionPermissions.fulfilled, (state, action) => {
        state.sectionPermissions = action.payload;
      });
  },
});

export const { setSectionPermissions, upsertSectionPermission, removeSectionPermission } = dashboardSlice.actions;
export default dashboardSlice.reducer;
