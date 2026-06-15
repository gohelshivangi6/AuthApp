import { Box, Typography, Paper } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";

export default function RevenueOpsPulse() {
  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 1200, margin: "0 auto" }}>
      <Paper
        sx={{
          p: 4,
          background: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <ShowChartIcon sx={{ fontSize: 64, color: "#6366f1", mb: 2 }} />
        <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1 }}>
          Revenue Operations Pulse
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Real-time revenue metrics and operational KPIs
        </Typography>
      </Paper>
    </Box>
  );
}
