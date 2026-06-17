import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { logout } from "../redux/slices/authSlice";
import { disconnectSockets } from "../utils/websocket";
import { clearSessionToken } from "../utils/sessionToken";
import axios from "axios";

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch {
      // proceed with local cleanup even if API fails
    }
    dispatch(logout());
    disconnectSockets();
    clearSessionToken();
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!token) return;

    const checkExpiry = () => {
      const decoded = decodeJWT(token);
      if (decoded?.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          handleLogout();
        }
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 30000);
    return () => clearInterval(interval);
  }, [token, handleLogout]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "rgba(18, 18, 43, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <DashboardIcon sx={{ color: "#6366f1", fontSize: 24 }} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "0.02em",
          }}
        >
          AuthApp
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#6366f1",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
          <Typography
            variant="body2"
            sx={{ color: "#f8fafc", fontWeight: 500 }}
          >
            {user?.name || user?.email}
          </Typography>
        </Box>

        <Button
          variant="text"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: "#94a3b8",
            textTransform: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            "&:hover": {
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.08)",
            },
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
