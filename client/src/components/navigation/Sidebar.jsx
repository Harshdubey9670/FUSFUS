import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { cn } from "../../utils/cn";
import { Home, Compass, MessageSquare, Bell, User, PlusSquare, BarChart3, DollarSign, Sparkles, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Sidebar = ({ className }) => {
  const { unreadNotificationsCount } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.home"),           icon: Home,         path: "/app" },
    { label: t("nav.explore"),        icon: Compass,      path: "/app/explore" },
    { label: "AI Studio",             icon: Sparkles,     path: "/app/ai" },
    { label: "Creator Studio",        icon: BarChart3,    path: "/app/creator" },
    { label: "Monetization",          icon: DollarSign,   path: "/app/monetization" },
    { label: t("nav.camera"),         icon: PlusSquare,   path: "/app/camera" },
    { label: t("nav.notifications"),  icon: Bell,         path: "/app/notifications", badge: unreadNotificationsCount },
    { label: t("nav.chat"),           icon: MessageSquare, path: "/app/chat" },
    { label: "Secure Vault",          icon: ShieldCheck,  path: "/app/vault" },
    { label: t("nav.profile"),        icon: User,         path: "/app/profile" },
  ];

  return (
    // lg: full sidebar with labels | md: icon-only collapsed | below md: hidden (bottom nav takes over)
    <aside className={cn(
      "hidden md:flex flex-col border-r border-border-soft/60 bg-bg-base/70 backdrop-blur-md py-4 h-full select-none overflow-y-auto hide-scrollbar shrink-0",
      // md: collapsed icon-only (64px wide), lg: full with labels (240px wide)
      "md:w-16 lg:w-60",
      "md:px-2 lg:px-4",
      className
    )}>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/app"}
            aria-label={`${item.label}${item.badge > 0 ? ` (${item.badge} unread)` : ''}`}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all duration-200",
              // On md: centered icon; on lg: left-aligned with label
              "md:justify-center lg:justify-start",
              isActive
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
            )}
          >
            {({ isActive }) => (
              <>
                {/* Active left accent — only on lg where there's room */}
                {isActive && (
                  <div className="hidden lg:block absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full hero-gradient shadow-glow" />
                )}

                <div className="relative shrink-0">
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary-500 scale-110" : "text-text-secondary group-hover:text-text-primary"
                  )} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-bg-base">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label — hidden on md, shown on lg */}
                <span className="hidden lg:block text-sm tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Settings at bottom */}
      <div className="mt-auto pt-3 border-t border-border-soft/60">
        <NavLink
          to="/app/settings"
          aria-label="Settings"
          className={({ isActive }) => cn(
            "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all duration-200",
            "md:justify-center lg:justify-start",
            isActive
              ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="hidden lg:block absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full hero-gradient shadow-glow" />
              )}
              <div className={cn(
                "h-5 w-5 shrink-0 rounded-full border border-current flex items-center justify-center text-[10px] font-bold transition-transform group-hover:rotate-45 duration-300",
                isActive ? "text-primary-500" : "text-text-secondary group-hover:text-text-primary"
              )}>
                ⚙
              </div>
              <span className="hidden lg:block text-sm tracking-tight">{t("nav.settings")}</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
};
