import { Box, Typography, Paper } from "@mui/material";
import TouchAppIcon from "@mui/icons-material/TouchApp";

export default function ProductEngagementTracker() {
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
        <TouchAppIcon sx={{ fontSize: 64, color: "#10b981", mb: 2 }} />
        <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1 }}>
          Product Engagement Tracker
        </Typography>
        <Typography variant="body1" color="textSecondary">
          User engagement and product adoption analytics
        </Typography>
      </Paper>
    </Box>
  );
}
