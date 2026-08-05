import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";
import { Download, ShieldAlert, X } from "lucide-react";
import api from "../../services/api";
import { useState } from "react";
import { logout } from "../../store/authSlice";

const DeleteAccountModal = ({ isOpen, onClose, onDelete }) => {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    await onDelete();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border-soft">
        <div className="flex items-center justify-between p-4 border-b border-border-soft">
          <h3 className="font-bold text-lg text-red-500">Delete Account</h3>
          <button onClick={onClose} className="p-1 hover:bg-bg-surface-hover rounded-lg text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-text-primary font-medium">Are you absolutely sure you want to delete your account?</p>
          <p className="text-text-secondary text-sm">
            This action cannot be undone. This will permanently delete your account, posts, followers, and all associated data.
          </p>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type "DELETE" to confirm</label>
            <input 
              type="text" 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-bg-base border border-border-soft rounded-xl p-3 text-text-primary focus:outline-none focus:border-red-500 transition-colors"
              placeholder="DELETE"
            />
          </div>
          <button 
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || loading}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountSettings = () => {
  const { user, settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleUpdate = async (category, key, value) => {
    // Optimistic update
    const updates = { [category]: { [key]: value } };
    dispatch(optimisticUpdateSetting(updates));
    
    // Background sync
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update setting" });
    }
  };

  const handleDownloadData = async () => {
    try {
      toast({ title: "Processing...", description: "Aggregating your data...", variant: "info" });
      const response = await api.get('/api/settings/download-data', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `snapgram_data_${user?.username}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Success", description: "Data downloaded successfully", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download data", variant: "error" });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/api/users/me");
      dispatch(logout());
      window.location.href = "/login";
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to delete account" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Account Center</h2>
        <p className="text-text-secondary">Manage your personal information, security, and account data.</p>
      </div>

      <div id="personal-info" className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2">Personal Information</h3>
        
        <div className="flex flex-col sm:flex-row justify-between py-2">
          <div className="text-text-secondary">Email</div>
          <div className="font-medium text-text-primary">{user?.email}</div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between py-2">
          <div className="text-text-secondary">Username</div>
          <div className="font-medium text-text-primary">@{user?.username}</div>
        </div>
      </div>

      <div id="security" className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2">Security</h3>
        
        <SettingToggle 
          label="Two-Factor Authentication" 
          description="Require a code when logging in from an unrecognized device."
          checked={settings?.security?.twoFactorEnabled || false}
          onChange={(val) => handleUpdate('security', 'twoFactorEnabled', val)}
        />

        <SettingToggle 
          label="Biometric Lock" 
          description="Use Face ID or Fingerprint to unlock the app."
          checked={settings?.security?.biometricLock || false}
          onChange={(val) => handleUpdate('security', 'biometricLock', val)}
        />
      </div>

      <div id="account-status" className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2">Data & Export</h3>
        
        <div className="py-2">
          <h4 className="font-semibold text-text-primary mb-1">Download Account Data</h4>
          <p className="text-sm text-text-secondary mb-4">Get a copy of everything you've shared on SnapGram AI.</p>
          <button 
            onClick={handleDownloadData}
            className="flex items-center gap-2 px-4 py-2 bg-bg-base border border-border-soft rounded-xl hover:bg-bg-surface-hover transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Request Data Export
          </button>
        </div>
      </div>

      <div id="deactivate" className="bg-bg-surface border border-red-500/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-red-500 border-b border-red-500/20 pb-2 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Danger Zone
        </h3>
        
        <div className="py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-text-primary">Delete Account</h4>
            <p className="text-sm text-text-secondary">Permanently delete your profile and posts.</p>
          </div>
          <button 
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors font-medium whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onDelete={handleDeleteAccount}
      />
    </div>
  );
};

export default AccountSettings;
