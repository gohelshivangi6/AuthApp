import { Box, Typography, Paper } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";

export default function LeadershipCommandCenter() {
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
        <GroupIcon sx={{ fontSize: 64, color: "#a855f7", mb: 2 }} />
        <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1 }}>
          Leadership Command Center
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Executive overview of organizational performance
        </Typography>
      </Paper>
    </Box>
  );
}
