import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, Bell } from "lucide-react";
import { CreateMenuModal } from "./CreateMenuModal";
import { CreatePostModal } from "../post/CreatePostModal";

export const Navbar = () => {
  const { unreadNotificationsCount } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  if (location.pathname !== '/app') return null;

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass border-b border-border-soft bg-bg-base/80 backdrop-blur-xl transition-all duration-300">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-[1400px] mx-auto gap-2">
          
          {/* Left Actions: Create Menu */}
          <div className="shrink-0 flex items-center">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 group transition-transform duration-200 active:scale-95"
              aria-label="Create New"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl hero-gradient flex items-center justify-center text-white shadow-sm group-hover:rotate-90 transition-transform shrink-0">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Right Actions: Notifications */}
          <div className="flex items-center shrink-0">
            <Link
              to="/app/notifications"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-surface-hover transition-all text-text-primary hover:scale-105 active:scale-95"
              aria-label={`View notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
            >
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-500 border-2 border-bg-base"></span>
                </span>
              )}
            </Link>
          </div>

        </div>
      </nav>

      {/* Modals */}
      <CreateMenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenCreatePost={() => setIsCreatePostOpen(true)} 
      />
      <CreatePostModal 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)} 
      />
    </>
  );
};
