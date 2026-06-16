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
  const token = useSelector((state) => state.auth.token);
  const prevAuthRef = useRef(false);
  console.log("..user", user);
  console.log("..isAuthenticated", isAuthenticated);
  console.log("..token", token);

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
  }, [isAuthenticated, user, token]);

  return (
    <WebSocketContext.Provider value={{}}>
      {children}
    </WebSocketContext.Provider>
  );
}
