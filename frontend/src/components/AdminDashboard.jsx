import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import SecurityIcon from "@mui/icons-material/Security";
import WidgetsIcon from "@mui/icons-material/Widgets";
import TimelineIcon from "@mui/icons-material/Timeline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import UserManager from "./admin/UserManager";
import DepartmentManager from "./admin/DepartmentManager";
import RoleManager from "./admin/RoleManager";
import PermissionManager from "./admin/PermissionManager";
import WidgetManager from "./admin/WidgetManager";
import AnalyticsPanel from "./admin/AnalyticsPanel";
import ActivityLogTable from "./admin/ActivityLogTable";
import UserStatsPanel from "./admin/UserStatsPanel";

const TABS = [
  { label: "Overview", icon: <DashboardIcon />, component: <AnalyticsPanel /> },
  { label: "Users", icon: <PeopleIcon />, component: <UserManager /> },
  { label: "Departments", icon: <BusinessIcon />, component: <DepartmentManager /> },
  { label: "Roles", icon: <BadgeIcon />, component: <RoleManager /> },
  { label: "Permissions", icon: <SecurityIcon />, component: <PermissionManager /> },
  { label: "Widgets", icon: <WidgetsIcon />, component: <WidgetManager /> },
  { label: "User Stats", icon: <TimelineIcon />, component: <UserStatsPanel /> },
  { label: "Activity Logs", icon: <ListAltIcon />, component: <ActivityLogTable /> },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 3 }}>
        Admin Dashboard
      </Typography>

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
            "& .MuiTab-root": { textTransform: "none", fontFamily: "Outfit", fontWeight: 600 },
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
        }}
      >
        {TABS[tab]?.component}
      </Paper>
    </Box>
  );
}
