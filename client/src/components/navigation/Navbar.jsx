import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Avatar } from "../ui/Avatar";
import { Search, Bell, MessageSquare, X, ChevronDown } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, unreadNotificationsCount } = useSelector((state) => state.auth);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const location = useLocation();
  const isProfilePage = location.pathname.includes('/app/profile');
  const isSettingsPage = location.pathname.includes('/app/settings');

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-border-soft bg-bg-base/80 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-[1400px] mx-auto gap-2">

        {/* Brand / Profile username */}
        <div className="shrink-0">
          {isProfilePage ? (
            <div className="flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-bg-surface-hover transition-colors" role="button" tabIndex={0} aria-label="Toggle profile menu">
              <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-text-primary truncate max-w-[120px] sm:max-w-none">
                {user?.username || "profile"}
              </span>
              <ChevronDown className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" aria-hidden="true" />
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group transition-transform duration-200 active:scale-95" aria-label="Go to Home">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl hero-gradient flex items-center justify-center text-white shadow-sm group-hover:rotate-6 transition-transform shrink-0">
                <span className="font-extrabold text-xs sm:text-sm tracking-tighter">IS</span>
              </div>
              <span className="hero-text text-lg sm:text-xl md:text-2xl font-black tracking-tight drop-shadow-sm hidden xs:block sm:block">
                InstaSnap
              </span>
            </Link>
          )}
        </div>

        {/* Desktop Search — hidden on mobile and settings page */}
        {!isSettingsPage && (
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-4 lg:mx-6">
            <GlobalSearch />
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 shrink-0">

          {/* Mobile Search Trigger — hidden on settings and on md+ */}
          {!isSettingsPage && (
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-surface-hover text-text-primary transition-all active:scale-95"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          {/* Notifications — desktop only (mobile has it in bottom nav) */}
          {!isSettingsPage && (
            <Link
              to="/app/notifications"
              className="relative min-w-[44px] min-h-[44px] hidden md:flex items-center justify-center rounded-full hover:bg-bg-surface-hover transition-all text-text-primary hover:scale-105 active:scale-95"
              aria-label={`View notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-500 border-2 border-bg-base"></span>
                </span>
              )}
            </Link>
          )}

          {/* Direct Chat */}
          <Link
            to="/app/chat"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-surface-hover transition-all text-text-primary hover:scale-105 active:scale-95"
            title="Direct Chat"
            aria-label="Open chat"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>

          {/* Profile Avatar */}
          <Link
            to={`/app/profile/${user?._id || ''}`}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-primary-500/80 transition-all hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go to your profile"
          >
            <Avatar
              src={user?.profilePicture || user?.avatar}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border-soft object-cover"
              fallback={user?.username?.charAt(0)?.toUpperCase() || 'U'}
            />
          </Link>

          <div className="pl-0.5 sm:pl-1">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-bg-base flex flex-col md:hidden"
          >
            <div className="flex items-center border-b border-border-soft bg-bg-base h-14 px-2">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
                aria-label="Close search"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
              <div className="flex-1">
                <GlobalSearch isMobile={true} onClose={() => setIsMobileSearchOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
