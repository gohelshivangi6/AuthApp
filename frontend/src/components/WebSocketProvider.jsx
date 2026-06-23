import { createContext, useContext, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  connectUserSocket,
  connectAdminSocket,
  disconnectSockets,
  getUserSocket,
} from "../utils/websocket";
import { updateUser, logout } from "../redux/slices/authSlice";
import { fetchDashboardData, fetchSectionPermissions, setLayoutForSlug } from "../redux/slices/dashboardSlice";
import { fetchStats } from "../redux/slices/adminSlice";
import { receiveMessage, receiveEditedMessage, receiveDeletedMessage } from "../redux/slices/workspaceSlice";
import { clearSessionToken } from "../utils/sessionToken";
import { checkStatus } from "../services/authService";
import { getDashboardLayout } from "../services/dashboardService";

const WebSocketContext = createContext(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const token = useSelector((state) => state.auth.token);
  const prevAuthRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      connectUserSocket(token);
      if (user.role === "admin") {
        connectAdminSocket(token);
      }

      prevAuthRef.current = true;
    }

    if (!isAuthenticated && prevAuthRef.current) {
      disconnectSockets();
      prevAuthRef.current = false;
    }
  }, [isAuthenticated, user, token, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getUserSocket();
    if (!socket) return;

    const handlePermUpdate = (data) => {
      if (data.type === "user" && data.user) {
        dispatch(updateUser(data.user));
        return;
      }

      dispatch(fetchSectionPermissions());

      if (data.type === "permission" || data.type === "template" || data.type === "assignment") {
        return;
      }

      dispatch(fetchDashboardData());
      checkStatus()
        .then((res) => {
          if (res.data.user) {
            dispatch(updateUser(res.data.user));
          }
        })
        .catch(() => {});
    };

    socket.on("permissions-updated", handlePermUpdate);

    const handleStatsUpdate = () => {
      if (user?.role === "admin") {
        dispatch(fetchStats());
      }
    };

    socket.on("stats-updated", handleStatsUpdate);

    const handleLayoutUpdate = (data) => {
      if (!data.slug) return;
      getDashboardLayout(data.slug)
        .then((res) => dispatch(setLayoutForSlug({ slug: data.slug, layout: res.data.layout })))
        .catch(() => {});
    };

    socket.on("layout-updated", handleLayoutUpdate);

    const handleWorkspaceMessage = (data) => {
      if (data.type === "new" && data.message) {
        dispatch(receiveMessage({ workspaceId: data.message.workspaceId, message: data.message }));
      } else if (data.type === "edited" && data.message) {
        dispatch(receiveEditedMessage({ workspaceId: data.message.workspaceId, message: data.message }));
      } else if (data.type === "deleted") {
        dispatch(receiveDeletedMessage({ workspaceId: data.workspaceId, messageId: data.messageId }));
      }
    };

    socket.on("workspace-message", handleWorkspaceMessage);

    const handleForceLogout = () => {
      dispatch(logout());
      disconnectSockets();
      clearSessionToken();
    };

    socket.on("force-logout", handleForceLogout);

    return () => {
      socket.off("permissions-updated", handlePermUpdate);
      socket.off("stats-updated", handleStatsUpdate);
      socket.off("layout-updated", handleLayoutUpdate);
      socket.off("workspace-message", handleWorkspaceMessage);
      socket.off("force-logout", handleForceLogout);
    };
  }, [dispatch, isAuthenticated, user?.role]);

  const activityRef = useRef({ lastEmit: 0, hasActivity: false });

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      activityRef.current.hasActivity = true;
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    const interval = setInterval(() => {
      if (activityRef.current.hasActivity) {
        const now = Date.now();
        if (now - activityRef.current.lastEmit >= 10000) {
          const sock = getUserSocket();
          if (sock?.connected) {
            sock.emit("event", { eventType: "activity" });
            activityRef.current.lastEmit = now;
            activityRef.current.hasActivity = false;
          }
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return (
    <WebSocketContext.Provider value={{}}>
      {children}
    </WebSocketContext.Provider>
  );
}
