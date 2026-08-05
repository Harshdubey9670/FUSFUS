import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { Shield, Key, Smartphone, Monitor, X, LogOut } from "lucide-react";
import api from "../../services/api";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast({ variant: "error", title: "Error", description: "New passwords do not match" });
    }

    setLoading(true);
    try {
      await api.put("/api/auth/change-password", { currentPassword, newPassword });
      toast({ variant: "success", title: "Success", description: "Password changed successfully" });
      onClose();
    } catch (error) {
      toast({ 
        variant: "error", 
        title: "Error", 
        description: error.response?.data?.message || "Failed to change password" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border-soft">
        <div className="flex items-center justify-between p-4 border-b border-border-soft">
          <h3 className="font-bold text-lg text-text-primary">Change Password</h3>
          <button onClick={onClose} className="p-1 hover:bg-bg-surface-hover rounded-lg text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-bg-base border border-border-soft rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-bg-base border border-border-soft rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-bg-base border border-border-soft rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

const SecuritySettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/auth/sessions');
      setSessions(res.data.data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleUpdate2FA = async () => {
    const newVal = !(settings?.security?.twoFactorEnabled);
    const updates = { security: { twoFactorEnabled: newVal } };
    dispatch(optimisticUpdateSetting(updates));
    
    try {
      await dispatch(updateSettings(updates)).unwrap();
      toast({ 
        variant: "success", 
        title: "2FA Updated", 
        description: newVal ? "Two-factor authentication enabled" : "Two-factor authentication disabled" 
      });
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update 2FA" });
    }
  };

  const handleLogoutSession = async (sessionId) => {
    try {
      await api.delete(`/api/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      toast({ variant: "success", title: "Success", description: "Session logged out" });
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to logout session" });
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      await api.delete(`/api/auth/sessions`);
      toast({ variant: "success", title: "Success", description: "Logged out of all other devices" });
      fetchSessions(); // Refresh list to only show current
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to logout other sessions" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Security</h2>
        <p className="text-text-secondary">Keep your account safe and secure.</p>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Login Security</h3>
        
        <button 
          onClick={() => setPasswordModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Change Password</p>
              <p className="text-sm text-text-secondary">Update your password regularly</p>
            </div>
          </div>
        </button>

        <button 
          onClick={handleUpdate2FA}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Two-Factor Authentication</p>
              <p className="text-sm text-text-secondary">
                {settings?.security?.twoFactorEnabled ? "Enabled" : "Add an extra layer of security"}
              </p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${settings?.security?.twoFactorEnabled ? 'bg-primary-500' : 'bg-bg-base border border-border-soft'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings?.security?.twoFactorEnabled ? 'left-7' : 'left-1'}`} />
          </div>
        </button>
      </div>

      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-soft pb-2 mb-4">
          <h3 className="text-lg font-bold text-text-primary">Active Sessions</h3>
          {sessions.length > 1 && (
            <button 
              onClick={handleLogoutAllOther}
              className="text-sm text-red-500 font-medium hover:bg-red-500/10 px-3 py-1 rounded-lg transition-colors"
            >
              Log out all other devices
            </button>
          )}
        </div>
        
        {sessionsLoading ? (
          <p className="text-text-secondary text-sm">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-text-secondary text-sm">No active sessions found.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, index) => {
              // We'll consider the latest session the current one for display purposes
              // In a real app, we'd compare the session token with the client's token
              const isCurrent = index === sessions.length - 1; 
              
              return (
                <div key={session._id} className={`flex items-center justify-between p-3 rounded-xl ${isCurrent ? 'bg-bg-surface-hover border border-primary-500/30' : 'hover:bg-bg-surface-hover transition-colors'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-bg-base text-text-secondary">
                      {session.deviceString.toLowerCase().includes('mobile') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{session.deviceString || "Unknown Device"}</p>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-green-500' : 'text-text-secondary'}`}>
                        {isCurrent ? 'Active now (This device)' : `Active: ${new Date(session.lastActive).toLocaleString()}`}
                      </p>
                      <p className="text-xs text-text-tertiary">IP: {session.ip}</p>
                    </div>
                  </div>
                  {!isCurrent && (
                    <button 
                      onClick={() => handleLogoutSession(session._id)}
                      className="text-sm text-red-500 font-semibold hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
};

export default SecuritySettings;
