import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingSelect } from "./SettingSelect";
import { SettingToggle } from "./SettingToggle";

const LanguageSettings = () => {
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
        <h2 className="text-2xl font-bold hero-text mb-2">Language</h2>
        <p className="text-text-secondary">Customize your language and translation preferences.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">App Language</h3>
        
        <SettingSelect
          label="Display Language"
          description="Choose the language for buttons, menus, and other interface text."
          value={settings?.language?.preferred || 'en'}
          options={[
            { value: 'en', label: 'English (US)' },
            { value: 'hi', label: 'Hindi' },
            { value: 'es', label: 'Español' },
            { value: 'ar', label: 'العربية (Arabic)' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' }
          ]}
          onChange={(val) => handleUpdate('language', 'preferred', val)}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Translations</h3>
        
        <SettingToggle 
          label="Auto-Translate Posts" 
          description="Automatically translate post captions and comments to your display language."
          checked={settings?.language?.autoTranslate ?? true}
          onChange={(val) => handleUpdate('language', 'autoTranslate', val)}
        />
      </div>
    </div>
  );
};

export default LanguageSettings;
