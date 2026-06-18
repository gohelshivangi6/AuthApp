import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert, Button, Paper } from "@mui/material";
import axios from "axios";

export default function Reactivate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");
  const hasValidParams = !!(token && userId);

  const [status, setStatus] = useState(() => hasValidParams ? "loading" : "error");
  const [message, setMessage] = useState(() => hasValidParams ? "" : "Invalid reactivation link.");

  useEffect(() => {
    if (!hasValidParams) return;

    let cancelled = false;

    axios
      .post("http://localhost:5000/api/auth/reactivate", { token, userId })
      .then((res) => {
        if (!cancelled) {
          setStatus("success");
          setMessage(res.data.message || "Account reactivated successfully!");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          setMessage(err?.response?.data?.message || "Failed to reactivate account.");
        }
      });

    return () => { cancelled = true; };
  }, [token, userId, hasValidParams]);

  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => navigate("/login", { replace: true }), 4000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

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
        {status === "loading" && (
          <Box>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography>Reactivating your account...</Typography>
          </Box>
        )}

        {status === "success" && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login page...
            </Typography>
          </Box>
        )}

        {status === "error" && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Redirecting to login page...
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
