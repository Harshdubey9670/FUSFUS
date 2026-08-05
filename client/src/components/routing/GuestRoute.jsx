import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { GlobalLoadingOverlay } from "../ui/GlobalLoadingOverlay";

export const GuestRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth || { isAuthenticated: false, loading: false });

  if (loading) {
    return <GlobalLoadingOverlay />;
  }

  if (isAuthenticated) {
    // If the user is already logged in, redirect them away from auth pages
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};
