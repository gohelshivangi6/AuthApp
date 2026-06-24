import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useSelector } from "react-redux";

const PublicRoute = () => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  console.log("PublicRoute Render", {
    user,
    loading,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
