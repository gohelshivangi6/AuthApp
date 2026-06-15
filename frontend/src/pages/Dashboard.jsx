
import { useSelector } from "react-redux";
import { Box, CircularProgress } from "@mui/material";
import AdminDashboard from "../components/AdminDashboard";
import UserDashboard from "../components/UserDashboard";

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading && !user) {
    return (
      <Box
        display="flex"
        minHeight="80vh"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

export default Dashboard;
