import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";

const AccessibilitySettings = () => {
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
        <h2 className="text-2xl font-bold hero-text mb-2">Accessibility</h2>
        <p className="text-text-secondary">Customize the app to fit your needs.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Vision</h3>
        
        <SettingToggle 
          label="High Contrast" 
          description="Increase color contrast for easier reading."
          checked={settings?.accessibility?.highContrast || false}
          onChange={(val) => handleUpdate('accessibility', 'highContrast', val)}
        />
        
        <SettingToggle 
          label="Screen Reader Optimizations" 
          description="Enhance labels and focus rings for screen reader navigation."
          checked={settings?.accessibility?.screenReader || false}
          onChange={(val) => handleUpdate('accessibility', 'screenReader', val)}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Motion</h3>
        
        <SettingToggle 
          label="Reduce Motion" 
          description="Disable or reduce UI animations and transitions."
          checked={settings?.accessibility?.reduceMotion || false}
          onChange={(val) => handleUpdate('accessibility', 'reduceMotion', val)}
        />
      </div>
    </div>
  );
};

export default AccessibilitySettings;
