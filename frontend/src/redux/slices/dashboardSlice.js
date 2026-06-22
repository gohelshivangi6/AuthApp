import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as dashboardService from "../../services/dashboardService";

export const fetchDashboardData = createAsyncThunk("dashboard/fetchData", async () => {
  const res = await dashboardService.getDashboardData();
  return res.data;
});

export const fetchSectionPermissions = createAsyncThunk("dashboard/fetchSectionPermissions", async () => {
  const res = await dashboardService.getSectionPermissions();
  return res.data.permissions;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    departments: [],
    widgets: [],
    sectionPermissions: [],
    layoutBySlug: {},
    loading: false,
    error: null,
  },
  reducers: {
    setSectionPermissions(state, action) {
      state.sectionPermissions = action.payload;
    },
    setLayoutForSlug(state, action) {
      const { slug, layout } = action.payload;
      state.layoutBySlug[slug] = layout;
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

export const { setSectionPermissions, upsertSectionPermission, removeSectionPermission, setLayoutForSlug } = dashboardSlice.actions;
export default dashboardSlice.reducer;
