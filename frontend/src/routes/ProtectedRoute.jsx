import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  // const { user, loading } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;