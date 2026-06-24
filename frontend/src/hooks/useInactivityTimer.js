import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserSocket } from "../utils/websocket";
import { logout } from "../redux/slices/authSlice";
import { disconnectSockets } from "../utils/websocket";
import { clearSessionToken } from "../utils/sessionToken";
import { logout as logoutApi } from "../services/authService";

const HEARTBEAT_INTERVAL_MS = 60000; // heartbeat every 60s while active
const INACTIVITY_TIMEOUT_MS = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS) || 300000;

const GRACE_PERIOD_SEC = Number(import.meta.env.VITE_GRACE_PERIOD_SEC) || 120;
console.log("inac", INACTIVITY_TIMEOUT_MS);
console.log("gra", GRACE_PERIOD_SEC);

export default function useInactivityTimer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  const [warningOpen, setWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(GRACE_PERIOD_SEC);
  const [extending, setExtending] = useState(false);

  const graceIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const warningOpenRef = useRef(false); 

  useEffect(() => {
    warningOpenRef.current = warningOpen;
  }, [warningOpen]);

  const handleAutoLogout = useCallback(async () => {
    if (graceIntervalRef.current) {
      clearInterval(graceIntervalRef.current);
      graceIntervalRef.current = null;
    }
    setWarningOpen(false);

    try {
      const sock = getUserSocket();
      if (sock?.connected) {
        sock.emit("inactivity-logout");
      }
    } catch (_) {}

    try {
      await logoutApi();
    } catch (_) {}

    dispatch(logout());
    disconnectSockets();
    clearSessionToken();
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  const startGracePeriod = useCallback(() => {
    if (graceIntervalRef.current) return;

    setCountdown(GRACE_PERIOD_SEC);
    setWarningOpen(true);

    try {
      const sock = getUserSocket();
      if (sock?.connected) {
        sock.emit("inactivity-warning-triggered");
      }
    } catch (_) {}

    graceIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        console.log(`[useInactivityTimer] Grace countdown: ${next}s`);
        if (next <= 0) {
          console.log(`[useInactivityTimer] Grace period expired! Triggering auto-logout.`);
          clearInterval(graceIntervalRef.current);
          graceIntervalRef.current = null;
          // Defer logout slightly to avoid React state update warnings
          setTimeout(handleAutoLogout, 0);
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [handleAutoLogout]);

  const handleStayActive = useCallback(async () => {
    console.log(`[useInactivityTimer] 'Stay Active' clicked. Extending session.`);
    setExtending(true);
    try {
      if (graceIntervalRef.current) {
        clearInterval(graceIntervalRef.current);
        graceIntervalRef.current = null;
      }

      const sock = getUserSocket();
      if (sock?.connected) {
        sock.emit("stayed-active");
      }

      lastActivityRef.current = Date.now();
      setWarningOpen(false);
      setCountdown(GRACE_PERIOD_SEC);
    } catch (_) {
      handleAutoLogout();
    } finally {
      setExtending(false);
    }
  }, [handleAutoLogout]);

  const handleDismiss = useCallback(() => {
    setWarningOpen(false);
  }, []);

  // Main effect: robust polling loop
  useEffect(() => {
    if (!isAuthenticated || !user || user.role === "admin") {
      setWarningOpen(false);
      if (graceIntervalRef.current) {
        clearInterval(graceIntervalRef.current);
        graceIntervalRef.current = null;
      }
      return;
    }

    lastActivityRef.current = Date.now();

    // 1. Activity Listener
    let lastLogTime = 0;
    const handleActivity = () => {
      if (warningOpenRef.current) return;
      lastActivityRef.current = Date.now();
      
      // Throttle the console.log so we don't flood the console on mousemove
      if (Date.now() - lastLogTime > 2000) {
        console.log(`[useInactivityTimer] Activity detected. Idle timer reset to 0.`);
        lastLogTime = Date.now();
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    // 2. Checker Interval (Checks every 5s)
    const checkInterval = setInterval(() => {
      if (warningOpenRef.current) return;
      
      const idleTime = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_MS - idleTime);
      
      console.log(`[useInactivityTimer] Checker -> Idle for: ${Math.floor(idleTime/1000)}s | Limit: ${Math.floor(INACTIVITY_TIMEOUT_MS/1000)}s | Remaining: ${Math.floor(remaining/1000)}s`);
      
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        console.log(`[useInactivityTimer] Inactivity timeout reached! Starting grace period...`);
        startGracePeriod();
      }
    }, 5000);

    // 3. Heartbeat Interval
    const heartbeat = setInterval(() => {
      if (warningOpenRef.current) return;
      const sock = getUserSocket();
      if (sock?.connected) {
        console.log(`[useInactivityTimer] Emitting heartbeat to backend.`);
        sock.emit("event", { eventType: "heartbeat" });
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(checkInterval);
      clearInterval(heartbeat);
    };
  }, [isAuthenticated, user, startGracePeriod]);

  // Listen for existing pending inactivity warning on WS connect
  useEffect(() => {
    if (!isAuthenticated || !user || user.role === "admin") return;

    const socket = getUserSocket();
    if (!socket) return;

    const handler = (data) => {
      if (data.userId !== user.id) return;
      if (!warningOpenRef.current) {
        startGracePeriod();
      }
    };

    socket.on("inactivity-warning", handler);
    return () => {
      socket.off("inactivity-warning", handler);
    };
  }, [isAuthenticated, user, startGracePeriod]);

  return {
    warningOpen,
    countdown,
    extending,
    handleStayActive,
    handleDismiss,
  };
}

