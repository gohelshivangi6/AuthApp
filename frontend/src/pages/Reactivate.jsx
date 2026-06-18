import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert, Button, Paper } from "@mui/material";
import axios from "axios";

function formatRemaining(ms) {
  if (ms <= 0) return "Expired";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function Reactivate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");
  const hasValidParams = !!(token && userId);

  const [pageState, setPageState] = useState(() => hasValidParams ? "loading" : "error");
  const [userName, setUserName] = useState("");
  const [remainingMs, setRemainingMs] = useState(0);
  const [message, setMessage] = useState(() => hasValidParams ? "" : "Invalid reactivation link.");
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    if (!hasValidParams) return;

    let cancelled = false;

    axios
      .get("http://localhost:5000/api/auth/reactivate-status", {
        params: { token, userId },
      })
      .then((res) => {
        if (!cancelled) {
          setUserName(res.data.name);
          setRemainingMs(res.data.remainingMs);
          setPageState(res.data.expired ? "expired" : "ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPageState("error");
          setMessage(err?.response?.data?.message || "Failed to check account status.");
        }
      });

    return () => { cancelled = true; };
  }, [token, userId, hasValidParams]);

  useEffect(() => {
    if (pageState !== "ready") return;
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next <= 0) {
          setPageState("expired");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pageState]);

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/reactivate", { token, userId });
      setPageState("success");
      setMessage(res.data.message || "Account reactivated successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      setPageState("error");
      setMessage(err?.response?.data?.message || "Failed to reactivate account.");
      setReactivating(false);
    }
  };

  const handleGoToLogin = () => navigate("/login");

  return (
    <Box
      display="flex"
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      sx={{ px: 2 }}
    >
      <Paper
        sx={{
          p: 5,
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          background: "rgba(18,18,38,0.8)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
        }}
      >
        {pageState === "loading" && (
          <Box>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography>Checking account status...</Typography>
          </Box>
        )}

        {pageState === "ready" && (
          <Box>
            <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 2 }}>
              Account Flagged for Deletion
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Hello <strong>{userName}</strong>,
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your account has been flagged for deletion. If you do not reactivate within the remaining time, your account will be permanently deleted.
            </Typography>
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, color: "#ef4444" }}>
                {formatRemaining(remainingMs)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                remaining before permanent deletion
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleReactivate}
              disabled={reactivating}
              sx={{ mb: 1.5, py: 1.2 }}
            >
              {reactivating ? "Reactivating..." : "Reactivate My Account"}
            </Button>
            <Typography variant="body2" color="text.secondary">
              Or simply{" "}
              <Button variant="text" size="small" onClick={handleGoToLogin} sx={{ textTransform: "none", p: 0, minWidth: "auto" }}>
                log in
              </Button>{" "}
              to cancel the deletion.
            </Typography>
          </Box>
        )}

        {pageState === "expired" && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              Your account has been permanently deleted.
            </Alert>
            <Button variant="outlined" onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </Box>
        )}

        {pageState === "success" && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login page...
            </Typography>
          </Box>
        )}

        {pageState === "error" && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Button variant="outlined" onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
