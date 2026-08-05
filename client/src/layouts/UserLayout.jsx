import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUnreadNotificationsCount, incrementUnreadCount, fetchSettings, updateUserRelations } from "../store/authSlice";
import { useTheme } from "../contexts/ThemeContext";
import { useSocketContext } from "../contexts/SocketContext";
import api from "../services/api";
import { Navbar } from "../components/navigation/Navbar";
import { Sidebar } from "../components/navigation/Sidebar";
import { MobileNav } from "../components/navigation/MobileNav";
import { CreatePostModal } from "../components/post/CreatePostModal";
import { Plus } from "lucide-react";

export const UserLayout = () => {
  const dispatch = useDispatch();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { socket } = useSocketContext();
  const { user: authUser } = useSelector((state) => state.auth);

  // Fetch initial unread notification count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get("/api/notifications/unread");
        if (res.data.success) {
          dispatch(setUnreadNotificationsCount(res.data.count));
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications count", err);
      }
    };
    fetchUnreadCount();
    dispatch(fetchSettings());
  }, [dispatch]);

  // Real-time socket event listeners for relationship notifications
  useEffect(() => {
    if (!socket || !authUser) return;

    const handleNotificationCountUpdate = ({ delta }) => {
      if (delta > 0) {
        dispatch(incrementUnreadCount());
      }
    };

    const handleFollowRequest = (data) => {
      // Increment unread notification badge
      dispatch(incrementUnreadCount());
    };

    const handleFollowAccepted = (data) => {
      // Increment unread notification badge
      dispatch(incrementUnreadCount());
    };

    const handleNewNotification = (data) => {
      dispatch(incrementUnreadCount());
    };

    const handleRelationshipUpdated = (data) => {
      // Silently handled — UI reflects current auth state after each API call
      console.info('[Socket] Relationship updated:', data.type, 'by:', data.byUserId);
    };

    socket.on('notification_count_update', handleNotificationCountUpdate);
    socket.on('follow_request', handleFollowRequest);
    socket.on('follow_accepted', handleFollowAccepted);
    socket.on('new_notification', handleNewNotification);
    socket.on('relationship_updated', handleRelationshipUpdated);

    return () => {
      socket.off('notification_count_update', handleNotificationCountUpdate);
      socket.off('follow_request', handleFollowRequest);
      socket.off('follow_accepted', handleFollowAccepted);
      socket.off('new_notification', handleNewNotification);
      socket.off('relationship_updated', handleRelationshipUpdated);
    };
  }, [socket, authUser, dispatch]);

  // Handle Global Theme Application
  const { settings } = useSelector((state) => state.auth);
  const { setTheme } = useTheme();
  
  useEffect(() => {
    if (settings?.accessibility?.theme) {
      if (settings.accessibility.theme === 'dark') {
        setTheme('dark');
      } else if (settings.accessibility.theme === 'light') {
        setTheme('light');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        } else {
          setTheme('light');
        }
      }
    }
  }, [settings?.accessibility?.theme, setTheme]);

  // Handle Global Font Size Application
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (settings?.accessibility?.fontSize) {
      if (settings.accessibility.fontSize === 'small') {
        root.style.fontSize = '14px';
      } else if (settings.accessibility.fontSize === 'large') {
        root.style.fontSize = '18px';
      } else {
        root.style.fontSize = '16px';
      }
    } else {
      root.style.fontSize = '16px';
    }
  }, [settings?.accessibility?.fontSize]);

  // Handle Global Language Application
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings?.language?.preferred) {
      root.lang = settings.language.preferred;
    }
  }, [settings?.language?.preferred]);

  const location = useLocation();
  
  // Pages that should take full available width (no padding, no max-width)
  const isFullWidthPage = location.pathname.includes('/chat')
    || location.pathname.includes('/settings')
    || location.pathname.includes('/camera');

  // Pages where the FAB should be hidden
  const hideFAB = location.pathname.includes('/reels')
    || location.pathname.includes('/camera')
    || location.pathname.includes('/chat');

  // Pages where the feed/main area uses overflow-hidden (e.g. reels use their own scroll)
  const isOwnScrollPage = location.pathname.includes('/reels')
    || location.pathname.includes('/camera');

  return (
    <div className="h-dvh w-screen overflow-hidden bg-bg-base text-text-primary flex flex-col relative selection:bg-primary-500/20 selection:text-primary-500">
      {/* Background ambient lighting (fixed, pointer-events-none) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute -top-40 -left-40 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-primary-500/30 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-secondary-500/30 blur-[120px]" />
      </div>

      {/* ── Fixed top Navbar ── */}
      <div className="relative z-40 flex-shrink-0">
        <Navbar />
      </div>

      {/* ── Body row: sidebar + main content ── */}
      <div className="relative z-10 flex flex-1 min-h-0 w-full max-w-[1400px] mx-auto">

        {/* Left Sidebar — fixed height, never scrolls */}
        <Sidebar />

        {/* Main content — THE ONLY scroll container */}
        <main
          className={[
            "flex-1 min-w-0",
            // Give main its own scroll box — this is the key change
            isOwnScrollPage ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
            // Smooth scrolling
            "scroll-smooth",
            // Hide scrollbar on mobile for clean feel
            "hide-scrollbar md:no-scrollbar",
            // Mobile: add bottom padding for MobileNav
            "pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0",
          ].join(" ")}
          id="main-feed-scroll"
        >
          <div className={isFullWidthPage ? "w-full h-full" : "w-full max-w-full"}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global FAB — fixed, never moves */}
      {!hideFAB && (
        <button
          onClick={() => setIsCreateOpen(true)}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 lg:right-8 z-40 p-3.5 md:p-4 rounded-full hero-gradient text-white shadow-2xl hover:scale-110 hover:shadow-glow transition-all duration-300 flex items-center justify-center group border border-white/20 active:scale-95"
          title="Create New Post"
          aria-label="Create New Post"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
        </button>
      )}

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Bottom mobile navigation — fixed, never moves */}
      <MobileNav />
    </div>
  );
};

