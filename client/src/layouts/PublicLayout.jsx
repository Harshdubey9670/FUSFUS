import { Outlet } from "react-router-dom";
import { PublicNavbar } from "../components/navigation/PublicNavbar";
import { Footer } from "../components/navigation/Footer";

export const PublicLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
