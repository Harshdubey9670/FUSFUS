import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { UserLayout } from "./layouts/UserLayout";
import { AdminLayout } from "./layouts/AdminLayout";

// Routing Wrappers
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { GuestRoute } from "./components/routing/GuestRoute";

// Global Overlay
import { GlobalLoadingOverlay } from "./components/ui/GlobalLoadingOverlay";
import { NetworkBanner } from "./components/ui/NetworkBanner";
import { AccessibilityEnforcer } from "./components/ui/AccessibilityEnforcer";
import { AiAssistantDrawer } from "./components/ai/AiAssistantDrawer";

// Lazy-loaded Pages
// Public

import { NotFound404 } from "./components/feedback/NotFound404";
import { SplashScreen } from "./components/ui/SplashScreen";

// Auth
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const OtpPage = lazy(() => import("./pages/auth/OtpPage"));
const ProfileSetupPage = lazy(() => import("./pages/auth/ProfileSetupPage"));

// User App
const FeedPage = lazy(() => import("./pages/user/FeedPage"));
const ReelsPage = lazy(() => import("./pages/user/ReelsPage"));
const CreateReelPage = lazy(() => import("./pages/user/CreateReelPage"));
const StoriesPage = lazy(() => import("./pages/user/StoriesPage"));
const CreateStoryPage = lazy(() => import("./pages/user/CreateStoryPage"));
const CameraPage = lazy(() => import("./pages/user/CameraPage"));
const ExplorePage = lazy(() => import("./pages/user/ExplorePage"));
const SearchResultsPage = lazy(() => import("./pages/user/SearchResultsPage"));
const ChatPage = lazy(() => import("./pages/user/ChatPage"));
const VaultPage = lazy(() => import("./pages/user/VaultPage"));
const NotificationsPage = lazy(() => import("./pages/user/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));
const NetworkPage = lazy(() => import("./pages/user/NetworkPage"));
const HashtagPage = lazy(() => import("./pages/user/HashtagPage"));
const TrendingHashtagsPage = lazy(() => import("./pages/user/TrendingHashtagsPage"));
const UsernameLookupPage = lazy(() => import("./pages/user/UsernameLookupPage"));
const SettingsPage = lazy(() => import("./pages/user/SettingsPage"));
const CreatorStudioPage = lazy(() => import("./pages/creator/CreatorStudioPage"));
const MonetizationDashboardPage = lazy(() => import("./pages/creator/MonetizationDashboardPage"));
const AiStudioPage = lazy(() => import("./pages/user/AiStudioPage"));
const PostDetailPage = lazy(() => import("./pages/user/PostDetailPage"));

// Live Streaming (Not part of layout for full screen)
import { LiveHostView } from "./components/live/LiveHostView";
import { LiveViewerView } from "./components/live/LiveViewerView";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUser } from "./store/authSlice";

// Admin
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Suspense fallback={<GlobalLoadingOverlay />}>
      <AccessibilityEnforcer />
      <NetworkBanner />
      <Routes>
        
        {/* --- Splash Screen --- */}
        <Route path="/splash" element={<SplashScreen />} />

        {/* --- Public Routes --- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
        </Route>

        {/* --- Auth Routes (Guests Only) --- */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/otp" element={<OtpPage />} />
            <Route path="/auth/profile-setup" element={<ProfileSetupPage />} />
          </Route>
        </Route>

        {/* --- Protected User Routes (Requires Authentication) --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<UserLayout />}>
            <Route index element={<FeedPage />} />
            <Route path="reels" element={<ReelsPage />} />
            <Route path="spotlight" element={<ReelsPage />} />
            <Route path="reels/create" element={<CreateReelPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="story/create" element={<CreateStoryPage />} />
            <Route path="camera" element={<CameraPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="discover" element={<ExplorePage />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:id" element={<ChatPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:id" element={<ProfilePage />} />
            <Route path="profile/:id/followers" element={<NetworkPage />} />
            <Route path="profile/:id/following" element={<NetworkPage />} />
            <Route path="hashtag/:tag" element={<HashtagPage />} />
            <Route path="trending-hashtags" element={<TrendingHashtagsPage />} />
            <Route path="profile/u/:username" element={<UsernameLookupPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="creator" element={<CreatorStudioPage />} />
            <Route path="monetization" element={<MonetizationDashboardPage />} />
            <Route path="ai" element={<AiStudioPage />} />
            <Route path="post/:id" element={<PostDetailPage />} />
          </Route>
          
          {/* Live routes outside UserLayout for full screen immersion */}
          <Route path="/app/live/new" element={<LiveHostView />} />
          <Route path="/app/live/:id" element={<LiveViewerView />} />
        </Route>

        {/* --- Protected Admin Routes (Requires Admin Role) --- */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            {/* Additional Admin routes can go here */}
          </Route>
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound404 />} />
      </Routes>
      <AiAssistantDrawer />
    </Suspense>
  );
}

export default App;
