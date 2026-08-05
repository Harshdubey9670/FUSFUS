import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";

const NotificationSettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (type, key, value) => {
    const updates = { notifications: { [type]: { ...settings?.notifications?.[type], [key]: value } } };
    
    // Optimistic update
    dispatch(optimisticUpdateSetting(updates));
    
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update notification settings" });
    }
  };

  const handlePauseAll = async (val) => {
    const updates = { notifications: { pauseAll: val } };
    dispatch(optimisticUpdateSetting(updates));
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update notification settings" });
    }
  };

  const isPaused = settings?.notifications?.pauseAll || false;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Notifications</h2>
        <p className="text-text-secondary">Choose how you want to be notified about activity.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <SettingToggle 
          label="Pause All Notifications" 
          description="Temporarily mute all push notifications."
          checked={isPaused}
          onChange={(val) => handlePauseAll(val)}
        />
      </div>

      <div className={`transition-opacity duration-300 ${isPaused ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2 mb-8">
          <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Push Notifications</h3>
          
          <SettingToggle 
            label="Likes & Comments" 
            checked={settings?.notifications?.push?.likes ?? true}
            onChange={(val) => handleUpdate('push', 'likes', val)}
          />
          <SettingToggle 
            label="Mentions & Tags" 
            checked={settings?.notifications?.push?.mentions ?? true}
            onChange={(val) => handleUpdate('push', 'mentions', val)}
          />
          <SettingToggle 
            label="Direct Messages" 
            checked={settings?.notifications?.push?.messages ?? true}
            onChange={(val) => handleUpdate('push', 'messages', val)}
          />
          <SettingToggle 
            label="New Followers" 
            checked={settings?.notifications?.push?.newFollowers ?? true}
            onChange={(val) => handleUpdate('push', 'newFollowers', val)}
          />
          <SettingToggle 
            label="Live Videos" 
            checked={settings?.notifications?.push?.live ?? true}
            onChange={(val) => handleUpdate('push', 'live', val)}
          />
        </div>

        <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
          <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Email Notifications</h3>
          
          <SettingToggle 
            label="Security Alerts" 
            description="Important alerts about your account security."
            checked={settings?.notifications?.email?.securityAlerts ?? true}
            onChange={(val) => handleUpdate('email', 'securityAlerts', val)}
          />
          <SettingToggle 
            label="News & Updates" 
            description="Feature updates and community news."
            checked={settings?.notifications?.email?.news ?? true}
            onChange={(val) => handleUpdate('email', 'news', val)}
          />
          <SettingToggle 
            label="Marketing Emails" 
            checked={settings?.notifications?.email?.marketing ?? false}
            onChange={(val) => handleUpdate('email', 'marketing', val)}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
