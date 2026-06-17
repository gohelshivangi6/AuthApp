import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";

// Import Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Setup2FA from "./pages/Setup2FA";
import Verify2FA from "./pages/Verify2FA";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import DashboardNav from "./pages/DashboardNav";
import RevenueOpsPulse from "./pages/RevenueOpsPulse";
import LeadershipCommandCenter from "./pages/LeadershipCommandCenter";
import ProductEngagementTracker from "./pages/ProductEngagementTracker";
import GlobalSalesCockpit from "./pages/GlobalSalesCockpit";

// Import Components
import DevMailbox from "./components/DevMailbox";
import HierarchyTable from "./components/HierarchyTable";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import { WebSocketProvider } from "./components/WebSocketProvider";

// Create a custom modern dark theme using Outfit and Inter typography
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1", // Indigo
      light: "#818cf8",
      dark: "#4f46e5",
    },
    secondary: {
      main: "#a855f7", // Purple
      light: "#c084fc",
      dark: "#9333ea",
    },
    background: {
      default: "#0a0a16",
      paper: "#12122b",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    error: {
      main: "#ef4444",
    },
    success: {
      main: "#10b981",
    },
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif" },
    h2: { fontFamily: "'Outfit', sans-serif" },
    h3: { fontFamily: "'Outfit', sans-serif" },
    h4: { fontFamily: "'Outfit', sans-serif" },
    h5: { fontFamily: "'Outfit', sans-serif" },
    h6: { fontFamily: "'Outfit', sans-serif" },
    button: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0a0a16",
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Dynamic mesh gradient background element */}
        <Box className="app-background" />

        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            pb: 8,
          }}
        >
          <WebSocketProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboards" replace />} />
              {/* <Route element={<PublicRoute />}> */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-2fa" element={<Verify2FA />} />
                <Route path="/setup-2fa" element={<Setup2FA />} />
              {/* </Route> */}

              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboards" element={<DashboardNav />} />
                <Route
                  path="/dashboards/revenue-ops-pulse"
                  element={<RevenueOpsPulse />}
                />
                <Route
                  path="/dashboards/leadership-command-center"
                  element={<LeadershipCommandCenter />}
                />
                <Route
                  path="/dashboards/product-engagement-tracker"
                  element={<ProductEngagementTracker />}
                />
                <Route
                  path="/dashboards/global-sales-cockpit"
                  element={<GlobalSalesCockpit />}
                />
                <Route
                  path="/hierarchy"
                  element={
                    <Box
                      sx={{
                        py: 6,
                        px: { xs: 2, md: 4 },
                        maxWidth: 1100,
                        margin: "0 auto",
                      }}
                    >
                      <HierarchyTable />
                    </Box>
                  }
                />
              </Route>

              {/* Catch-all redirects back to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </WebSocketProvider>
        </Box>

        {/* Developer Mailbox - simulated mailbox drawer overlay for local testing */}
        <DevMailbox />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
