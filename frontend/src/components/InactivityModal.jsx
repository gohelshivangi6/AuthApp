import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import { getUserSocket } from "../utils/websocket";
import { logout } from "../redux/slices/authSlice";
import { disconnectSockets } from "../utils/websocket";
import { clearSessionToken } from "../utils/sessionToken";
import { ping } from "../services/authService";

let lastInactivityEvent = 0;

export default function InactivityModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [extending, setExtending] = useState(false);
  const timerRef = useRef(null);

  const handleAutoLogout = useCallback(() => {
    setOpen(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    dispatch(logout());
    disconnectSockets();
    clearSessionToken();
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = getUserSocket();
    if (!socket) return;

    const handler = (data) => {
      if (data.userId !== user.id) return;

      const now = Date.now();
      if (now - lastInactivityEvent < 5000) return;
      lastInactivityEvent = now;

      if (timerRef.current) clearInterval(timerRef.current);

      setCountdown(120);
      setOpen(true);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            handleAutoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    socket.on("inactivity-warning", handler);
    return () => {
      socket.off("inactivity-warning", handler);
    };
  }, [isAuthenticated, user, handleAutoLogout]);

  const handleStayActive = async () => {
    setExtending(true);
    try {
      await ping();
      setOpen(false);
      setCountdown(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch {
      handleAutoLogout();
    } finally {
      setExtending(false);
    }
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "rgba(18, 18, 43, 0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pt: 4, position: "relative" }}>
        <IconButton
          onClick={handleDismiss}
          size="small"
          sx={{ position: "absolute", right: 8, top: 8, color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
        <WarningAmberIcon
          sx={{ fontSize: 56, color: "#f59e0b", mb: 1 }}
        />
        <Typography
          variant="h5"
          sx={{ fontFamily: "Outfit", fontWeight: 700 }}
        >
          Inactivity Warning
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center", px: 4 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          You've been inactive for 15 minutes. If you don't respond, you'll be
          automatically logged out after {formatTime(countdown)}.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 3,
          }}
        >
          <CircularProgress
            variant="determinate"
            value={(countdown / 120) * 100}
            size={48}
            sx={{ color: countdown > 30 ? "#f59e0b" : "#ef4444" }}
          />
          <Typography variant="h4" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
            {formatTime(countdown)}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Click below to stay logged in. Closing this will not stop the
          countdown — you'll be logged out when it reaches zero.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 4, px: 4, gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleStayActive}
          disabled={extending}
          sx={{ borderRadius: 2, px: 4, minWidth: 200 }}
        >
          {extending ? "Extending session..." : "Stay Active"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
