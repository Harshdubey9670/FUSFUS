import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";

const ChatSettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (category, key, value) => {
    const updates = { [category]: { [key]: value } };
    dispatch(optimisticUpdateSetting(updates));
    
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update setting" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Chat & Messages</h2>
        <p className="text-text-secondary">Customize your direct messaging experience.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Appearance</h3>
        
        <SettingSelect
          label="Chat Theme"
          description="Choose a default color theme for your chats."
          value={settings?.chat?.theme || 'default'}
          options={[
            { value: 'default', label: 'Default (Blue)' },
            { value: 'monochrome', label: 'Monochrome' },
            { value: 'sunset', label: 'Sunset Gradient' },
            { value: 'neon', label: 'Neon Cyber' },
          ]}
          onChange={(val) => handleUpdate('chat', 'theme', val)}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Privacy</h3>
        
        <SettingToggle 
          label="Auto Delete Messages" 
          description="Automatically delete messages after 24 hours."
          checked={settings?.chat?.autoDeleteMessages || false}
          onChange={(val) => handleUpdate('chat', 'autoDeleteMessages', val)}
        />
        
        <SettingToggle 
          label="Disappearing Mode" 
          description="Messages vanish immediately after they are seen."
          checked={settings?.chat?.disappearingMode || false}
          onChange={(val) => handleUpdate('chat', 'disappearingMode', val)}
        />
        
        <SettingToggle 
          label="Screenshot Detection" 
          description="Notify you if someone takes a screenshot of your chat."
          checked={settings?.chat?.screenshotDetection ?? true}
          onChange={(val) => handleUpdate('chat', 'screenshotDetection', val)}
        />
      </div>
    </div>
  );
};

export default ChatSettings;
