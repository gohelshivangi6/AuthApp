import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSocket } from "../utils/websocket";

export default function useDashboardAccess(slug) {
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getUserSocket();
    if (!socket) return;

    const handlePermUpdate = (data) => {
      if (
        data.type === "permission" &&
        data.targetType === "dashboard" &&
        data.path === slug &&
        (data.granted === false || data.action === "delete")
      ) {
        navigate("/dashboards", { replace: true });
      }
    };

    socket.on("permissions-updated", handlePermUpdate);
    return () => socket.off("permissions-updated", handlePermUpdate);
  }, [navigate, slug]);
}