import { Outlet, Link } from "react-router-dom";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ChevronLeft } from "lucide-react";

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-4 text-text-primary">
      {/* Back Arrow - Top Left */}
      <div className="absolute top-4 left-4">
        <Link 
          to="/" 
          className="p-2 flex items-center justify-center rounded-full bg-bg-surface border border-border-soft hover:bg-bg-base transition-colors"
          aria-label="Back to Home"
        >
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        </Link>
      </div>

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="hero-text text-3xl font-bold tracking-tight">SnapGram AI</h1>
          <p className="mt-2 text-text-secondary">Join the next generation of social media.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
