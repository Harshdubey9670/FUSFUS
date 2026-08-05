import { Outlet, NavLink } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";
import { Shield, Users, Activity, Settings } from "lucide-react";
import { cn } from "../utils/cn";

export const AdminLayout = () => {
  const adminLinks = [
    { label: "Dashboard", icon: Activity, path: "/admin" },
    { label: "Users",     icon: Users,    path: "/admin/users" },
    { label: "Moderation",icon: Shield,   path: "/admin/moderation" },
    { label: "Settings",  icon: Settings, path: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen min-h-dvh bg-bg-base text-text-primary overflow-x-hidden">
      <Navbar />

      {/* Mobile horizontal scrollable tab nav */}
      <nav
        className="md:hidden flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border-soft bg-bg-surface/80 backdrop-blur-sm px-2 py-1.5 sticky top-14 z-30"
        aria-label="Admin navigation"
      >
        {adminLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) => cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              isActive
                ? "bg-red-500/10 text-red-500 dark:text-red-400"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex w-full max-w-7xl mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 lg:w-64 flex-col border-r border-border-soft bg-bg-surface-hover/30 px-3 py-6 h-[calc(100dvh-4rem)] sticky top-16 shrink-0">
          <div className="mb-6 px-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Admin Panel</h3>
          </div>
          <nav className="flex-1 space-y-2">
            {adminLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-semibold"
                    : "text-text-primary hover:bg-bg-surface-hover"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0 pb-safe-20 md:pb-0 overflow-y-auto min-h-[calc(100dvh-4rem)]">
          <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
