import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Button,
} from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../redux/slices/dashboardSlice";
import WidgetRenderer from "./WidgetRenderer";
import { getUserSocket } from "../utils/websocket";
import axios from "axios";

export default function UserDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { departments, widgets, loading } = useSelector((state) => state.dashboard);
  const user = useSelector((state) => state.auth.user);
  const [hasDashboards, setHasDashboards] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardData());
    axios
      .get("http://localhost:5000/api/dashboard/allowed", { withCredentials: true })
      .then((res) => setHasDashboards(res.data.dashboards.length > 0))
      .catch(() => setHasDashboards(false));
  }, [dispatch]);

  useEffect(() => {
    const socket = getUserSocket();
    if (!socket) return;

    const handlePermUpdate = () => {
      dispatch(fetchDashboardData());
    };

    socket.on("permissions-updated", handlePermUpdate);
    return () => {
      socket.off("permissions-updated", handlePermUpdate);
    };
  }, [dispatch]);

  if (loading && departments.length === 0) {
    return (
      <Box display="flex" minHeight="60vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (departments.length === 0) {
    return (
      <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 900, margin: "0 auto" }}>
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            background: "rgba(18,18,38,0.6)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: "#6366f1", mb: 2 }} />
          <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 1 }}>
            No Departments Assigned
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You haven't been assigned to any department yet. Contact your admin.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 1100, margin: "0 auto" }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h4" sx={{ fontFamily: "Outfit", fontWeight: 800 }}>
          My Dashboard
        </Typography>
        {hasDashboards && (
          <Button
            variant="outlined"
            startIcon={<DashboardIcon />}
            onClick={() => navigate("/dashboards")}
            sx={{ textTransform: "none", fontFamily: "Outfit", fontWeight: 600 }}
          >
            View Dashboards
          </Button>
        )}
      </Box>
      <Typography variant="body2" color="textSecondary" mb={4}>
        Welcome, {user?.name || "User"}
      </Typography>

      {departments.map((dept) => (
        <Paper
          key={dept.id}
          sx={{
            p: 3,
            mb: 4,
            background: "rgba(18,18,38,0.6)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <AccountTreeIcon sx={{ color: "#a855f7" }} />
            <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
              {dept.name}
            </Typography>
            {dept.userRole && (
              <Chip
                label={dept.userRole.name}
                size="small"
                sx={{
                  background: "rgba(99,102,241,0.2)",
                  color: "#818cf8",
                  fontWeight: 600,
                }}
              />
            )}
            {dept.description && (
              <Typography variant="caption" color="textSecondary">
                {dept.description}
              </Typography>
            )}
          </Box>

          <Grid container spacing={2}>
            {widgets.map((widget) => (
              <Grid size={{ xs: 12, md: 6 }} key={widget.id}>
                <Paper
                  sx={{
                    p: 2,
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Outfit", fontWeight: 600 }}>
                    {widget.name}
                  </Typography>
                  <WidgetRenderer componentName={widget.componentName} />
                </Paper>
              </Grid>
            ))}
          </Grid>

          {widgets.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
              No widgets available for this department.
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
