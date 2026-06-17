import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DashboardContent from "../components/DashboardContent";
import { decryptData } from "../decrypt/decryption";
import { fetchSectionPermissions, setLayoutForSlug } from "../redux/slices/dashboardSlice";
import { emitEvent } from "../utils/websocket";
import useDashboardAccess from "../hooks/useDashboardAccess";
import { Box, CircularProgress } from "@mui/material";

const DASHBOARD_SLUG = "global-sales-cockpit";

export default function GlobalSalesCockpit() {
  useDashboardAccess(DASHBOARD_SLUG);
  const dispatch = useDispatch();
  const sectionPermissions = useSelector((s) => s.dashboard.sectionPermissions);
  const layout = useSelector((s) => s.dashboard.layoutBySlug[DASHBOARD_SLUG]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchSectionPermissions());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [dataRes, layoutRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard-data/global-sales-cockpit'),
          axios.get('http://localhost:5000/api/dashboard-data/global-sales-cockpit/layout'),
        ]);
        if (cancelled) return;
        const decrypted = await decryptData(dataRes.data);
        setData(decrypted);
        dispatch(setLayoutForSlug({ slug: DASHBOARD_SLUG, layout: layoutRes.data.layout }));
        emitEvent("dashboard_view", { dashboard: "global-sales-cockpit" });
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [dispatch]);

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

  return <DashboardContent data={data} hiddenSections={hiddenSections} layout={layout} />;
}
