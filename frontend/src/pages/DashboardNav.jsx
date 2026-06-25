import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GroupIcon from "@mui/icons-material/Group";
import ChatIcon from "@mui/icons-material/Chat";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import PublicIcon from "@mui/icons-material/Public";
import { getUserSocket, emitEvent } from "../utils/websocket";
import { getAllowedDashboards } from "../services/dashboardService";

const DASHBOARD_ICONS = {
  "revenue-ops-pulse": (
    <ShowChartIcon sx={{ fontSize: 48, color: "#6366f1" }} />
  ),
  "leadership-command-center": (
    <GroupIcon sx={{ fontSize: 48, color: "#a855f7" }} />
  ),
  "product-engagement-tracker": (
    <TouchAppIcon sx={{ fontSize: 48, color: "#10b981" }} />
  ),
  "global-sales-cockpit": (
    <PublicIcon sx={{ fontSize: 48, color: "#f59e0b" }} />
  ),
};

const DASHBOARD_COLORS = {
  "revenue-ops-pulse": "#6366f1",
  "leadership-command-center": "#a855f7",
  "product-engagement-tracker": "#10b981",
  "global-sales-cockpit": "#f59e0b",
};

export default function DashboardNav() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllowedDashboards = useCallback(() => {
    getAllowedDashboards()
      .then((res) => setDashboards(res.data.dashboards))
      .catch(() => setDashboards([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAllowedDashboards();
  }, [fetchAllowedDashboards]);

  useEffect(() => {
    const socket = getUserSocket();
    if (!socket) return;

    const handlePermUpdate = (data) => {
      if (data.type === "permission" || data.type === "assignment") {
        fetchAllowedDashboards();
      }
    };

    socket.on("permissions-updated", handlePermUpdate);
    return () => socket.off("permissions-updated", handlePermUpdate);
  }, [fetchAllowedDashboards]);

  useEffect(() => {
    emitEvent("dashboard_list_view");
  }, []);

  if (user?.role === "admin") {
    navigate("/dashboard", { replace: true });
    return null;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          minHeight: "60vh",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 1000, margin: "0 auto" }}>
      {/* <Button
        startIcon={<DashboardIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{
          mb: 2,
          textTransform: "none",
          fontFamily: "Outfit",
          fontWeight: 600,
        }}
      >
        Back to My Dashboard
      </Button> */}
      <Button
        startIcon={<ChatIcon />}
        onClick={() => navigate("/direct-messages")}
        sx={{
          mb: 2,
          ml: 2,
          textTransform: "none",
          fontFamily: "Outfit",
          fontWeight: 600,
        }}
      >
        Direct Messages
      </Button>
      <Button
        startIcon={<GroupIcon />}
        onClick={() => navigate("/workspaces")}
        sx={{
          mb: 2,
          ml: 2,
          textTransform: "none",
          fontFamily: "Outfit",
          fontWeight: 600,
        }}
      >
        Go to Workspaces
      </Button>
      <Typography
        variant="h4"
        sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1 }}
      >
        Dashboards
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={4}>
        Welcome, {user?.name || "User"}
      </Typography>

      {dashboards.length === 0 ? (
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
          <Typography
            variant="h6"
            sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 1 }}
          >
            No Dashboards Available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You don't have access to any dashboards yet. Contact your admin.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((db) => (
            <Grid size={{ xs: 12, sm: 6 }} key={db.id}>
              <Paper
                onClick={() => {
                  emitEvent("dashboard_click", {
                    dashboard: db.name,
                    path: db.path,
                  });
                  navigate(`/dashboards/${db.path}`);
                }}
                sx={{
                  p: 3,
                  cursor: "pointer",
                  background: "rgba(18,18,38,0.6)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: DASHBOARD_COLORS[db.path] || "#6366f1",
                    transform: "translateY(-2px)",
                    boxShadow: `0 4px 20px ${DASHBOARD_COLORS[db.path] || "#6366f1"}25`,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                  gap={2}
                  mb={1}
                >
                  {DASHBOARD_ICONS[db.path] || (
                    <ShowChartIcon sx={{ fontSize: 48, color: "#6366f1" }} />
                  )}
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Outfit", fontWeight: 700 }}
                  >
                    {db.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {db.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
