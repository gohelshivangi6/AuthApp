import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import SecurityIcon from "@mui/icons-material/Security";
import TimelineIcon from "@mui/icons-material/Timeline";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import UserManager from "./admin/UserManager";
import DepartmentManager from "./admin/DepartmentManager";
import RoleManager from "./admin/RoleManager";
import PermissionManager from "./admin/PermissionManager";
import AnalyticsPanel from "./admin/AnalyticsPanel";
import UserStatsPanel from "./admin/UserStatsPanel";
import DashboardLayoutEditor from "./admin/DashboardLayoutEditor";
import InactiveUserManager from "./admin/InactiveUserManager";

const TABS = [
  { label: "Overview", icon: <DashboardIcon />, component: <AnalyticsPanel /> },
  { label: "Users", icon: <PeopleIcon />, component: <UserManager /> },
  { label: "Inactive Users", icon: <PersonOffIcon />, component: <InactiveUserManager /> },
  { label: "Departments", icon: <BusinessIcon />, component: <DepartmentManager /> },
  { label: "Roles", icon: <BadgeIcon />, component: <RoleManager /> },
  { label: "Permissions", icon: <SecurityIcon />, component: <PermissionManager /> },
  { label: "User Stats", icon: <TimelineIcon />, component: <UserStatsPanel /> },
  { label: "Layouts", icon: <ViewQuiltIcon />, component: <DashboardLayoutEditor /> },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 1200, margin: "0 auto" }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ fontFamily: "Outfit", fontWeight: 800 }}>
          Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/workspaces")}
          sx={{ textTransform: "none", fontFamily: "Outfit", fontWeight: 600 }}
        >
          Go to Workspaces
        </Button>
      </Box>

      <Paper
        sx={{
          mb: 3,
          background: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontFamily: "Outfit", fontWeight: 600, mx: 0.2 },
          }}
        >
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Paper>

      <Paper
        sx={{
          p: 3,
          background: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          minHeight: 400,
          height: "auto",
          maxHeight: "600px",
          width: "1040px",
          overflow: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#0A192F #020617",
        }}
      >
        {TABS[tab]?.component}
      </Paper>
    </Box>
  );
}
