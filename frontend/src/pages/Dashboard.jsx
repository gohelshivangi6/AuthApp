import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Divider,
  Alert,
} from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import axios from "axios";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../routes/AuthContext";
import { clearSessionToken } from "../utils/sessionToken";
import { useDispatch, useSelector } from "react-redux";
import { loginStart, loginSuccess, logout } from "../redux/slices/authSlice";
import DonutChart from "../components/charts/DonutChart";
import ScatterPlot from "../components/charts/ScatterPlot";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";

const DATA_URL = "http://localhost:5000/api/auth/dashboard-data";
const LOGOUT_URL = "http://localhost:5000/api/auth/logout";

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  // const { setUser } = useAuth();

  const userr = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError("");
        const res = await axios.get(DATA_URL, {
          withCredentials: true, // necessary to send JWT HttpOnly cookie
        });

        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Unauthenticated or session expired:", err);
        // Redirect to login if unauthorized
        // navigate("/login", {
        //   state: { alertMessage: "Access denied. Please log in first." },
        // });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    clearSessionToken();
    try {
      await axios.post(LOGOUT_URL, {}, { withCredentials: true });
      dispatch(logout());
      navigate("/login", {
        state: { alertMessage: "Logged out successfully." },
      });
    } catch (err) {
      console.error("Logout failed", err);
      dispatch(logout());
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        minHeight="80vh"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress color="primary" />
        <Typography color="textSecondary">
          Loading secure workspace...
        </Typography>
      </Box>
    );
  }

  const user = data?.sessionDetails || {};

  return (
    <Box
      sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: "900px", margin: "0 auto" }}
    >
      {/* Top Banner */}
      <Paper
        elevation={4}
        sx={{
          p: 4,
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <VerifiedUserIcon sx={{ fontSize: 50, color: "#10b981" }} />
          <Box>
            <Typography
              variant="h5"
              sx={{ fontFamily: "Outfit", fontWeight: 800 }}
            >
              Secure Session Active
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your connection is encrypted and authenticated with Two-Factor
              security.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderColor: "rgba(239, 68, 68, 0.4)",
            "&:hover": { borderColor: "#ef4444" },
          }}
        >
          Sign Out
        </Button>
      </Paper>

      {/* Hierarchy Navigation Card */}
      <Paper
        elevation={4}
        sx={{
          p: 3,
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <AccountTreeIcon sx={{ fontSize: 36, color: "#a855f7" }} />
          <Box>
            <Typography
              variant="h6"
              sx={{ fontFamily: "Outfit", fontWeight: 700 }}
            >
              Hierarchy Drill-Down
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Zone Head → CSO → ASM → DB → Product → CKU
            </Typography>
          </Box>
        </Box>
        <Button
          component={RouterLink}
          to="/hierarchy"
          variant="contained"
          sx={{
            background:
              "linear-gradient(135deg, #6366f1, #a855f7)",
            color: "white",
            fontWeight: 600,
            textTransform: "none",
            px: 3,
            "&:hover": {
              filter: "brightness(1.1)",
            },
          }}
        >
          Open Hierarchy
        </Button>
      </Paper>

      {/* Grid of details */}
      {/* <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              background: "rgba(18, 18, 38, 0.6)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              color: "white",
              height: "100%",
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 80, color: "#6366f1", mb: 2 }} />
            <Typography
              variant="h6"
              sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 0.5 }}
            >
              {user.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              {user.email}
            </Typography>

            <Divider
              sx={{
                width: "100%",
                borderColor: "rgba(255,255,255,0.08)",
                my: 2,
              }}
            />

            <Box display="flex" alignItems="center" gap={1} color="#10b981">
              <CheckCircleIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" fontWeight="bold">
                2FA Identity Authenticated
              </Typography>
            </Box>
            <Typography variant="caption" color="textMuted" mt={1}>
              UserID: {user.userId}
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Box
            sx={{
              background: "rgba(18, 18, 38, 0.6)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              p: 3,
              color: "white",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SecurityIcon sx={{ color: "#a855f7" }} />
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "Outfit", fontWeight: 700 }}
                >
                  Cryptographic Payload
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  background: "rgba(255, 255, 255, 0.03)",
                  p: 2,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  mb: 2,
                  fontFamily: "monospace",
                }}
              >
                "{data?.secretMessage}"
              </Typography>

              <Alert
                severity="success"
                sx={{
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.1)",
                  color: "#34d399",
                  ".MuiAlert-icon": { color: "#10b981" },
                }}
              >
                The server validated your session token: JWT HttpOnly Secure
                cookie verification passed.
              </Alert>
            </Box>

            <Typography
              variant="caption"
              color="textMuted"
              mt={2}
              display="block"
              textAlign="right"
            >
              Verified at: {new Date(data?.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </Grid>
      </Grid> */}

      <Box mt={6}>
        <Typography variant="h5" mb={3}>
          D3 Learning Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Bar Chart</Typography>
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(18,18,38,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <BarChart />
              </Paper>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Line Chart</Typography>
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(18,18,38,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <LineChart />
              </Paper>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Donut Chart</Typography>
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(18,18,38,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <DonutChart />
              </Paper>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Scatter Plot</Typography>
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(18,18,38,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <ScatterPlot />
              </Paper>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
