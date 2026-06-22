import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSocket } from "../utils/websocket";
import { getAllowedDashboards } from "../services/dashboardService";

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
        return;
      }

      if (
        data.type === "template" &&
        data.targetType === "dashboard" &&
        data.path === slug &&
        data.granted === false
      ) {
        navigate("/dashboards", { replace: true });
        return;
      }

      if (data.type === "permission" && data.action === "bulk-save") {
        getAllowedDashboards()
          .then((res) => {
            const allowed = res.data.dashboards || [];
            if (!allowed.some((d) => d.path === slug)) {
              navigate("/dashboards", { replace: true });
            }
          })
          .catch(() => {});
      }
    };

    socket.on("permissions-updated", handlePermUpdate);
    return () => socket.off("permissions-updated", handlePermUpdate);
  }, [navigate, slug]);
}