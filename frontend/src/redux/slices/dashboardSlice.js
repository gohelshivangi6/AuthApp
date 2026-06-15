import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchDashboardData = createAsyncThunk("dashboard/fetchData", async () => {
  const res = await axios.get("http://localhost:5000/api/dashboard", {
    withCredentials: true,
  });
  return res.data;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    departments: [],
    widgets: [],
    loading: false,
    error: null,
  },
  reducers: {},
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
      });
  },
});

export default dashboardSlice.reducer;
