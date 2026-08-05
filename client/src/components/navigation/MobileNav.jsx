import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Home, Camera, MessageCircle, User, Compass, Bell } from "lucide-react";
import { cn } from "../../utils/cn";
import { Avatar } from "../ui/Avatar";

export const MobileNav = () => {
  const location = useLocation();
  const { user: authUser, unreadNotificationsCount } = useSelector((state) => state.auth);

  // Hide on full-screen pages
  const hiddenPages = ['/reels', '/spotlight', '/camera', '/story/create', '/reels/create'];
  const shouldHide = hiddenPages.some(p => location.pathname.includes(p));
  if (shouldHide) return null;

  const navItems = [
    { name: "Home",          icon: Home,          path: "/app",             exact: true },
    { name: "Explore",       icon: Compass,       path: "/app/explore" },
    { name: "Camera",        icon: Camera,        path: "/app/camera",      isCTA: true },
    { name: "Alerts",        icon: Bell,          path: "/app/notifications", badge: unreadNotificationsCount },
    { name: "Profile",       icon: User,          path: "/app/profile",     isProfile: true },
  ];

  return (
    // Show on mobile + tablet (below md:), hide at md and above (sidebar takes over)
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-base/95 backdrop-blur-2xl border-t border-border-soft/80 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex h-14 items-center justify-around px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          if (item.isCTA) {
            return (
              <NavLink
                key={item.name}
                to={item.path}
                aria-label={item.name}
                className="relative flex flex-col items-center justify-center w-full h-full active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-full hero-gradient flex items-center justify-center shadow-glow border-2 border-bg-base">
                  <item.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-col items-center justify-center w-full h-full text-text-secondary transition-all active:scale-90"
            >
              <div className="relative flex items-center justify-center w-10 h-9">
                {/* Animated active indicator bubble */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bubble"
                    className="absolute inset-0 bg-primary-500/15 rounded-2xl"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}

                {item.isProfile ? (
                  <div className={`p-0.5 rounded-full transition-all duration-200 ${isActive ? 'ring-2 ring-primary-500 scale-110' : 'opacity-80'}`}>
                    <Avatar
                      src={authUser?.profilePicture || authUser?.avatar}
                      className="w-6 h-6 rounded-full object-cover"
                      fallback={authUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "h-5 w-5 relative z-10 transition-all duration-200",
                        isActive ? "text-primary-500 scale-110 drop-shadow-sm" : "text-text-secondary"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {/* Notification badge */}
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-secondary-500 px-0.5 text-[9px] font-black text-white ring-2 ring-bg-base">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <span className={`text-[10px] font-bold tracking-tight transition-colors leading-none ${isActive ? 'text-primary-500' : 'text-text-secondary'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
