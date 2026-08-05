import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, Lock, Bell, Clock, 
  Smartphone, Eye, MessageSquare, Database, 
  Moon, Search, HelpCircle, LogOut, ChevronRight, ChevronLeft, ShieldAlert, Info
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Placeholder imports for settings sections
import AccountSettings from "../../components/settings/AccountSettings";
import PrivacySettings from "../../components/settings/PrivacySettings";
import SecuritySettings from "../../components/settings/SecuritySettings";
import NotificationSettings from "../../components/settings/NotificationSettings";
import AppearanceSettings from "../../components/settings/AppearanceSettings";
import AccessibilitySettings from "../../components/settings/AccessibilitySettings";
import LanguageSettings from "../../components/settings/LanguageSettings";
import HelpSettings from "../../components/settings/HelpSettings";
import AboutSettings from "../../components/settings/AboutSettings";
import TimeManagementSettings from "../../components/settings/TimeManagementSettings";
import ChatSettings from "../../components/settings/ChatSettings";
import MediaVaultSettings from "../../components/settings/MediaVaultSettings";
import AiSettings from "../../components/settings/AiSettings";

const SETTINGS_CATEGORIES = [
  { id: 'account', label: 'Account', icon: User, keywords: ['username', 'email', 'phone', 'password', 'personal', 'profile'], component: AccountSettings },
  { id: 'privacy', label: 'Privacy', icon: Lock, keywords: ['private', 'account', 'activity', 'status', 'blocked'], component: PrivacySettings },
  { id: 'security', label: 'Security', icon: ShieldAlert, keywords: ['password', '2fa', 'login', 'sessions'], component: SecuritySettings },
  { id: 'notifications', label: 'Notifications', icon: Bell, keywords: ['push', 'email', 'pause', 'quiet', 'alert'], component: NotificationSettings },
  { id: 'appearance', label: 'Appearance', icon: Moon, keywords: ['dark', 'light', 'theme', 'font', 'size', 'mode'], component: AppearanceSettings },
  { id: 'accessibility', label: 'Accessibility', icon: Eye, keywords: ['contrast', 'screen reader'], component: AccessibilitySettings },
  { id: 'language', label: 'Language', icon: Search, keywords: ['translate', 'english', 'spanish'], component: LanguageSettings },
  { id: 'help', label: 'Help', icon: HelpCircle, keywords: ['support', 'faq', 'report', 'problem'], component: HelpSettings },
  { id: 'about', label: 'About', icon: Info, keywords: ['version', 'terms', 'privacy policy', 'legal'], component: AboutSettings },
  // Additional specialized settings
  { id: 'time', label: 'Time Management', icon: Clock, keywords: ['daily', 'limit', 'reminder', 'break', 'screen time'], component: TimeManagementSettings },
  { id: 'chat', label: 'Chat & Messages', icon: MessageSquare, keywords: ['dm', 'message', 'reply', 'story', 'request'], component: ChatSettings },
  { id: 'media', label: 'Media & Vault', icon: Database, keywords: ['download', 'save', 'quality', 'upload', 'data', 'cellular'], component: MediaVaultSettings },
  { id: 'ai', label: 'AI Features', icon: Shield, keywords: ['suggestions', 'captions', 'filters', 'smart', 'bot'], component: AiSettings },
];

const ALL_FEATURES = [
  { id: 'personal-info', label: 'Personal Information', category: 'account', icon: User },
  { id: 'account-status', label: 'Account Status', category: 'account', icon: ShieldAlert },
  { id: 'security', label: 'Two-Factor Authentication & Security', category: 'account', icon: Lock },
  { id: 'deactivate', label: 'Deactivate Account', category: 'account', icon: LogOut },
  { id: 'private-account', label: 'Private Account', category: 'privacy', icon: Lock },
  { id: 'blocked', label: 'Blocked Users', category: 'privacy', icon: Shield },
  { id: 'push', label: 'Push Notifications', category: 'notifications', icon: Bell },
  { id: 'time', label: 'Daily Time Limit', category: 'time', icon: Clock },
  { id: 'theme', label: 'Display Theme (Dark Mode)', category: 'accessibility', icon: Moon },
  { id: 'font', label: 'Font Size', category: 'accessibility', icon: Eye },
  { id: 'language', label: 'App Language', category: 'accessibility', icon: Search },
];

const SettingsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true); // true means showing list, false means showing detail

  const navigate = useNavigate();
  const { settingsLoading } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Dynamically translate categories
  const translatedCategories = SETTINGS_CATEGORIES.map(c => ({
    ...c,
    label: t(`settings.categories.${c.id}`) || c.label
  }));

  const filteredCategories = translatedCategories.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const searchResults = searchQuery ? ALL_FEATURES.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  // Auto-select the first category when searching so the right panel updates immediately
  useEffect(() => {
    if (searchQuery && searchResults.length > 0) {
      const topCategory = searchResults[0].category;
      if (activeTab !== topCategory) {
        setActiveTab(topCategory);
      }
    } else if (searchQuery && filteredCategories.length > 0) {
      if (!filteredCategories.find(c => c.id === activeTab)) {
        setActiveTab(filteredCategories[0].id);
      }
    }
  }, [searchQuery]); // Removed filteredCategories and activeTab to prevent infinite loops

  const ActiveComponent = SETTINGS_CATEGORIES.find(c => c.id === activeTab)?.component || AccountSettings;

  const handleTabChange = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false); // Go to detail view on mobile
  };

  const handleFeatureClick = (feature) => {
    setActiveTab(feature.category);
    setIsMobileMenuOpen(false);
    setSearchQuery(''); // clear search
    setTimeout(() => {
      const el = document.getElementById(feature.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col md:flex-row bg-bg-surface border-0 sm:border border-border-soft sm:rounded-2xl overflow-hidden shadow-none sm:shadow-lg sm:mt-4">
      
      {/* Sidebar Navigation */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-border-soft flex flex-col h-full bg-bg-base/50 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 md:p-6 border-b border-border-soft">
          <div className="flex items-center gap-2 mb-4">
            <button 
              onClick={() => navigate('/app')} 
              className="p-2 -ml-2 rounded-full hover:bg-bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Back to Home"
            >
              <ChevronLeft className="w-6 h-6 text-text-primary" />
            </button>
            <h1 className="text-2xl font-bold hero-text">{t("settings.title")}</h1>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input 
              type="text" 
              placeholder={t("settings.searchPlaceholder")} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-bg-surface border-border-soft focus:ring-primary-500 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
          {searchQuery && searchResults.length > 0 ? (
            <div className="space-y-1">
              <p className="px-4 py-2 text-xs font-semibold tracking-wider text-text-secondary uppercase">{t("settings.features")}</p>
              {searchResults.map((feature) => {
                const Icon = feature.icon || Search;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature)}
                    className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl transition-all mb-1 text-text-primary hover:bg-bg-surface-hover"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-surface text-text-secondary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span>{feature.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-secondary opacity-0 group-hover:opacity-100" />
                  </button>
                )
              })}
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeTab === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleTabChange(category.id)}
                  className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl transition-all mb-1 ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-500 font-semibold' 
                      : 'text-text-primary hover:bg-bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-primary-500 text-white' : 'bg-bg-surface text-text-secondary'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span>{category.label}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-0 text-text-secondary group-hover:opacity-100'}`} />
                </button>
              )
            })
          )}

          <div className="mt-4 pt-4 border-t border-border-soft">
            <button
              onClick={() => dispatch(logout())}
              className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl transition-all text-red-500 hover:bg-red-500/10 font-semibold"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <LogOut className="w-5 h-5" />
                </div>
                <span>{t("nav.logout")}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 flex flex-col h-full bg-bg-base relative ${!isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
        {/* Mobile Header Back Button */}
        <div className="md:hidden p-4 border-b border-border-soft flex items-center gap-3 bg-bg-surface">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-full hover:bg-bg-base transition-colors"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <span className="font-bold text-lg">
            {translatedCategories.find(c => c.id === activeTab)?.label}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          {settingsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
