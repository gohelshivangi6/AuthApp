import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardContent from "../components/DashboardContent";
import { decryptData } from "../decrypt/decryption";
import { Box, CircularProgress } from "@mui/material";

export default function LeadershipCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axios.get('http://localhost:5000/api/dashboard-data/leadership-command-center')
      .then(async (res) => {
        if (cancelled) return;
        const decrypted = await decryptData(res.data);
        setData(decrypted);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <DashboardContent data={data} />;
}
