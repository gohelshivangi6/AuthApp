import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import axios from "axios";

const API = "http://localhost:5000/api/auth";

export default function StayActive() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  const [loading, setLoading] = useState(!!(token && userId));
  const [status, setStatus] = useState(!token || !userId ? "invalid" : "loading");
  const [name, setName] = useState("");
  const [remainingMs, setRemainingMs] = useState(0);
  const [extending, setExtending] = useState(false);
  const [message, setMessage] = useState("");

  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!token || !userId) return;

    let cancelled = false;

    axios
      .get(`${API}/inactivity-status`, {
        params: { token, userId },
      })
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (data.status === "valid") {
          setStatus("valid");
          setName(data.name || "User");
          setRemainingMs(data.remainingMs || 0);
        } else if (data.status === "active") {
          setStatus("active");
        } else if (data.status === "expired") {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("invalid");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, userId]);

  useEffect(() => {
    if (statusRef.current !== "valid") return;

    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const handleStayActive = async () => {
    setExtending(true);
    try {
      const res = await axios.post(`${API}/stay-active`, { token, userId });
      setMessage(res.data.message || "Session extended successfully.");
      setStatus("active");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to extend session";
      setMessage(msg);
      setStatus("expired");
    } finally {
      setExtending(false);
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "0:00";
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ px: 2 }}
    >
      <Paper
        sx={{
          p: 6,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          background: "rgba(18, 18, 43, 0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 3,
        }}
      >
        {status === "valid" && (
          <>
            <TouchAppIcon sx={{ fontSize: 56, color: "#f59e0b", mb: 2 }} />
            <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 1 }}>
              Are you still there, {name}?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              Your session will expire in:
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 3, color: remainingMs > 30000 ? "#f59e0b" : "#ef4444" }}>
              {formatTime(remainingMs)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click below to stay logged in, or you'll be logged out automatically.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleStayActive}
              disabled={extending}
              sx={{ borderRadius: 2, px: 4, minWidth: 200 }}
            >
              {extending ? "Extending session..." : "Stay Active"}
            </Button>
          </>
        )}

        {status === "active" && (
          <>
            <CheckCircleIcon sx={{ fontSize: 56, color: "#10b981", mb: 2 }} />
            <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 1 }}>
              {message || "Your session is active"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You can continue using the application as normal.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboards")}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {(status === "expired" || status === "invalid") && (
          <>
            <ErrorIcon sx={{ fontSize: 56, color: "#ef4444", mb: 2 }} />
            <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 1 }}>
              {status === "expired" ? "Session Expired" : "Invalid Link"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {status === "expired"
                ? "Your session has expired due to inactivity. Please log in again."
                : "This link is invalid or has already been used."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Go to Login
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
