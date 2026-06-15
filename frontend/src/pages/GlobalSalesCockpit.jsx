import { Box, Typography, Paper } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";

export default function GlobalSalesCockpit() {
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
        <PublicIcon sx={{ fontSize: 64, color: "#f59e0b", mb: 2 }} />
        <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1 }}>
          Global Sales Cockpit
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Worldwide sales pipeline and revenue forecasting
        </Typography>
      </Paper>
    </Box>
  );
}
