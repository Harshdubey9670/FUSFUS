import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingSelect } from "./SettingSelect";

const AppearanceSettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (category, key, value) => {
    const updates = { [category]: { [key]: value } };
    dispatch(optimisticUpdateSetting(updates));
    
    // ThemeContext will automatically pick up the Redux change and update the DOM

    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update setting" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Appearance</h2>
        <p className="text-text-secondary">Customize how InstaSnap AI looks on your device.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Theme</h3>
        
        <SettingSelect
          label="App Theme"
          description="Choose your preferred color scheme."
          value={settings?.accessibility?.theme || 'system'}
          options={[
            { value: 'light', label: 'Light Mode' },
            { value: 'dark', label: 'Dark Mode' },
            { value: 'system', label: 'System Default' }
          ]}
          onChange={(val) => handleUpdate('accessibility', 'theme', val)}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Text Size</h3>
        
        <SettingSelect
          label="Font Size"
          description="Adjust the size of text throughout the app."
          value={settings?.accessibility?.fontSize || 'medium'}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
          ]}
          onChange={(val) => handleUpdate('accessibility', 'fontSize', val)}
        />
      </div>
    </div>
  );
};

export default AppearanceSettings;
