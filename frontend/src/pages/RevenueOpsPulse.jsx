import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DashboardContent from "../components/DashboardContent";
import { decryptData } from "../decrypt/decryption";
import { fetchSectionPermissions } from "../redux/slices/dashboardSlice";
import { emitEvent, getUserSocket } from "../utils/websocket";
import useDashboardAccess from "../hooks/useDashboardAccess";
import { Box, CircularProgress } from "@mui/material";

const DASHBOARD_SLUG = "revenue-ops-pulse";

export default function RevenueOpsPulse() {
  useDashboardAccess(DASHBOARD_SLUG);
  const dispatch = useDispatch();
  const sectionPermissions = useSelector((s) => s.dashboard.sectionPermissions);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchSectionPermissions());
  }, [dispatch]);

  useEffect(() => {
    const socket = getUserSocket();
    if (!socket) return;
    const handlePermUpdate = () => {
      dispatch(fetchSectionPermissions());
    };
    socket.on("permissions-updated", handlePermUpdate);
    return () => socket.off("permissions-updated", handlePermUpdate);
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    axios.get('http://localhost:5000/api/dashboard-data/revenue-ops-pulse')
      .then(async (res) => {
        if (cancelled) return;
        const decrypted = await decryptData(res.data);
        setData(decrypted);
        emitEvent("dashboard_view", { dashboard: "revenue-ops-pulse" });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const hiddenSections = useMemo(() => {
    return sectionPermissions
      .filter((p) => p.targetId.startsWith(`${DASHBOARD_SLUG}::`) && !p.granted)
      .map((p) => p.targetId.split("::")[1]);
  }, [sectionPermissions]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <DashboardContent data={data} hiddenSections={hiddenSections} />;
}
