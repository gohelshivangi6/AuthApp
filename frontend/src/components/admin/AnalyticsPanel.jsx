import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Grid, Paper, CircularProgress,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import OnlinePredictionIcon from "@mui/icons-material/OnlinePrediction";
import TimelineIcon from "@mui/icons-material/Timeline";
import EventIcon from "@mui/icons-material/Event";
import SessionsIcon from "@mui/icons-material/History";
import { fetchStats } from "../../redux/slices/adminSlice";

function StatCard({ icon, label, value, color }) {
  return (
    <Paper
      sx={{
        p: 3,
        background: "rgba(18,18,38,0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
      <Box>
        <Typography variant="h4" sx={{ fontFamily: "Outfit", fontWeight: 800, color }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" color="textSecondary">{label}</Typography>
      </Box>
    </Paper>
  );
}

function formatDuration(ms) {
  if (!ms) return "0s";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AnalyticsPanel() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }} py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Typography variant="body2" color="textSecondary" py={4}>
        No stats available yet.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={3}>
        Analytics Overview
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            label="Total Users"
            value={stats.totalUsers}
            color="#6366f1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<OnlinePredictionIcon sx={{ fontSize: 40 }} />}
            label="Active Users"
            value={stats.activeUsers}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<SessionsIcon sx={{ fontSize: 40 }} />}
            label="Total Sessions"
            value={stats.totalSessions}
            color="#a855f7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<EventIcon sx={{ fontSize: 40 }} />}
            label="Total Events"
            value={stats.totalEvents}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<TimelineIcon sx={{ fontSize: 40 }} />}
            label="Total Time Spent"
            value={formatDuration(stats.totalTimeSpentMs)}
            color="#06b6d4"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
