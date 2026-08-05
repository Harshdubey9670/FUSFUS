import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";

const MediaVaultSettings = () => {
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
        <h2 className="text-2xl font-bold hero-text mb-2">Media & Vault</h2>
        <p className="text-text-secondary">Manage camera quality, post archiving, and memory backups.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Camera Settings</h3>
        
        <SettingSelect
          label="Camera Upload Quality"
          description="High quality uploads use more data."
          value={settings?.media?.cameraQuality || 'high'}
          options={[
            { value: 'standard', label: 'Standard (Data Saver)' },
            { value: 'high', label: 'High Quality' },
          ]}
          onChange={(val) => handleUpdate('media', 'cameraQuality', val)}
        />
        
        <SettingToggle 
          label="Save Original Photos" 
          description="Save unedited photos to your camera roll."
          checked={settings?.media?.saveOriginalPhotos ?? true}
          onChange={(val) => handleUpdate('media', 'saveOriginalPhotos', val)}
        />
        
        <SettingToggle 
          label="Save Original Videos" 
          description="Save unedited videos to your camera roll."
          checked={settings?.media?.saveOriginalVideos ?? true}
          onChange={(val) => handleUpdate('media', 'saveOriginalVideos', val)}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Archiving & Vault</h3>
        
        <SettingToggle 
          label="Auto-Archive Stories" 
          description="Automatically save stories to your archive after 24 hours."
          checked={settings?.media?.autoArchiveStories ?? true}
          onChange={(val) => handleUpdate('media', 'autoArchiveStories', val)}
        />
        
        <SettingToggle 
          label="Auto-Archive Posts" 
          description="Automatically move old posts to archive after 1 year."
          checked={settings?.media?.autoArchivePosts || false}
          onChange={(val) => handleUpdate('media', 'autoArchivePosts', val)}
        />
        
        <SettingToggle 
          label="Vault Cloud Backup" 
          description="Securely backup your Memories Vault to the cloud."
          checked={settings?.media?.vaultBackup ?? true}
          onChange={(val) => handleUpdate('media', 'vaultBackup', val)}
        />
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Sharing</h3>
        
        <SettingToggle 
          label="Watermark Downloads" 
          description="Add your username watermark when others download your content."
          checked={settings?.media?.watermarkDownloads ?? true}
          onChange={(val) => handleUpdate('media', 'watermarkDownloads', val)}
        />
      </div>
    </div>
  );
};

export default MediaVaultSettings;
