import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { GlobalLoadingOverlay } from "../ui/GlobalLoadingOverlay";

export const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth || { isAuthenticated: false, loading: false });
  const location = useLocation();

  if (loading) {
    return <GlobalLoadingOverlay />;
  }

  if (!isAuthenticated) {
    // Redirect them to the /auth/login page, but save the current location they were trying to go to
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    // If route requires admin but user is not admin, redirect to app home
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};
