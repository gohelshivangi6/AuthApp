import { createContext, useContext, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  connectUserSocket,
  connectAdminSocket,
  disconnectSockets,
  getUserSocket,
} from "../utils/websocket";
import { updateUser } from "../redux/slices/authSlice";
import { fetchDashboardData, upsertSectionPermission, removeSectionPermission } from "../redux/slices/dashboardSlice";
import { fetchStats } from "../redux/slices/adminSlice";
import axios from "axios";

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

      if (data.type === "permission" && data.targetType === "dashboard-section") {
        if (data.action === "upsert") {
          dispatch(upsertSectionPermission({
            targetType: "dashboard-section",
            targetId: data.targetId,
            granted: data.granted,
          }));
        } else if (data.action === "delete") {
          dispatch(removeSectionPermission(data.targetId));
        }
        return;
      }

      if (data.type !== "permission" && data.type !== "assignment") {
        dispatch(fetchDashboardData());
        axios
          .get("http://localhost:5000/api/auth/me", { withCredentials: true })
          .then((res) => {
            if (res.data.user) {
              dispatch(updateUser(res.data.user));
            }
          })
          .catch(() => {});
      }
    };

    socket.on("permissions-updated", handlePermUpdate);

    const handleStatsUpdate = () => {
      if (user?.role === "admin") {
        dispatch(fetchStats());
      }
    };

    socket.on("stats-updated", handleStatsUpdate);

    return () => {
      socket.off("permissions-updated", handlePermUpdate);
      socket.off("stats-updated", handleStatsUpdate);
    };
  }, [dispatch, isAuthenticated, user?.role]);

  return (
    <WebSocketContext.Provider value={{}}>
      {children}
    </WebSocketContext.Provider>
  );
}
