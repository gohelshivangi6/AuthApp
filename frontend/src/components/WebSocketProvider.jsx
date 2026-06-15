import { createContext, useContext, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  connectUserSocket,
  connectAdminSocket,
  disconnectSockets,
} from "../utils/websocket";

const WebSocketContext = createContext(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const prevAuthRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (cookieToken) {
        connectUserSocket(cookieToken);
        if (user.role === "admin") {
          connectAdminSocket(cookieToken);
        }
      }

      prevAuthRef.current = true;
    }

    if (!isAuthenticated && prevAuthRef.current) {
      disconnectSockets();
      prevAuthRef.current = false;
    }
  }, [isAuthenticated, user]);

  return (
    <WebSocketContext.Provider value={{}}>
      {children}
    </WebSocketContext.Provider>
  );
}
