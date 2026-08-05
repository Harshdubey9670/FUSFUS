import { Link } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Button } from "../ui/Button";

export const PublicNavbar = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border-soft transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="hero-text text-2xl font-black tracking-tight">SnapGram AI</span>
          </Link>

          {/* Center Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection("features")} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</button>
            <button onClick={() => scrollToSection("testimonials")} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Testimonials</button>
            <button onClick={() => scrollToSection("faq")} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">FAQ</button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden sm:flex" />
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/auth/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="gradient">Sign up</Button>
              </Link>
            </div>
            {/* Mobile Auth (simplified for now) */}
            <div className="sm:hidden flex items-center gap-2">
              <Link to="/auth/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
