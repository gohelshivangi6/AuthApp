import { useSelector } from "react-redux";
import { Box, CircularProgress } from "@mui/material";
import AdminDashboard from "../components/AdminDashboard";
import UserDashboard from "../components/UserDashboard";
import DashboardNav from "./DashboardNav";

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading && !user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          minHeight: "80vh",
          alignItems: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  // return <UserDashboard />;
  return <DashboardNav />
};

export default Dashboard;
