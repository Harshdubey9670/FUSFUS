import { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from "../ui/Toast";
import api from "../../services/api";
import { 
  updateBlockedUsers, 
  updateMutedUsers, 
  updateRestrictedUsers, 
  updateCloseFriends, 
  updateFollowing,
  fetchSettings 
} from "../../store/authSlice";

export const UserOptionsModal = ({ isOpen, onClose, user, onActionComplete }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const targetId = (user?._id || user?.id)?.toString();

  // Reactive relationship states
  const [localRelations, setLocalRelations] = useState({
    isBlocked: false,
    isMuted: false,
    isRestricted: false,
    isCloseFriend: false,
  });

  useEffect(() => {
    if (isOpen && user && targetId) {
      setLocalRelations({
        isBlocked: (authUser?.blockedUsers || []).some(
          (id) => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetId
        ),
        isMuted: (authUser?.mutedUsers || []).some(
          (id) => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetId
        ),
        isRestricted: (authUser?.restrictedUsers || []).some(
          (id) => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetId
        ),
        isCloseFriend: (authUser?.closeFriends || []).some(
          (id) => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetId
        ),
      });
    }
  }, [isOpen, user, targetId, authUser]);

  if (typeof document === "undefined" || !isOpen || !user) return null;

  const handleAction = async (actionLabel, endpoint) => {
    if (loading) return;
    setLoading(true);

    // Optimistic toggle
    if (endpoint === 'block') setLocalRelations(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
    if (endpoint === 'restrict') setLocalRelations(prev => ({ ...prev, isRestricted: !prev.isRestricted }));
    if (endpoint === 'mute') setLocalRelations(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (endpoint === 'close-friends') setLocalRelations(prev => ({ ...prev, isCloseFriend: !prev.isCloseFriend }));

    try {
      const res = await api.post(`/api/users/${targetId}/${endpoint}`);
      
      // Update Redux state with fresh server arrays
      if (res.data?.blockedUsers) dispatch(updateBlockedUsers(res.data.blockedUsers));
      if (res.data?.restrictedUsers) dispatch(updateRestrictedUsers(res.data.restrictedUsers));
      if (res.data?.mutedUsers) dispatch(updateMutedUsers(res.data.mutedUsers));
      if (res.data?.closeFriends) dispatch(updateCloseFriends(res.data.closeFriends));
      if (res.data?.following) dispatch(updateFollowing(res.data.following));

      // Update boolean states strictly from response if available
      if (typeof res.data?.isBlocked === 'boolean') setLocalRelations(prev => ({ ...prev, isBlocked: res.data.isBlocked }));
      if (typeof res.data?.isRestricted === 'boolean') setLocalRelations(prev => ({ ...prev, isRestricted: res.data.isRestricted }));
      if (typeof res.data?.isMuted === 'boolean') setLocalRelations(prev => ({ ...prev, isMuted: res.data.isMuted }));
      if (typeof res.data?.isCloseFriend === 'boolean') setLocalRelations(prev => ({ ...prev, isCloseFriend: res.data.isCloseFriend }));

      toast({ variant: 'success', title: 'Success', description: res.data?.message || `${actionLabel} updated` });
      
      if (onActionComplete) onActionComplete(endpoint);
    } catch (error) {
      // Revert optimistic update on failure
      if (endpoint === 'block') setLocalRelations(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
      if (endpoint === 'restrict') setLocalRelations(prev => ({ ...prev, isRestricted: !prev.isRestricted }));
      if (endpoint === 'mute') setLocalRelations(prev => ({ ...prev, isMuted: !prev.isMuted }));
      if (endpoint === 'close-friends') setLocalRelations(prev => ({ ...prev, isCloseFriend: !prev.isCloseFriend }));

      toast({ variant: 'error', title: 'Error', description: error.response?.data?.message || `Failed to update status` });
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setLoading(true);
    try {
      const res = await api.post(`/api/users/${targetId}/report`, { reason: reportReason });
      toast({ variant: 'success', title: 'Report Submitted', description: res.data?.message });
      setShowReportInput(false);
      setReportReason('');
      onClose();
    } catch (error) {
      toast({ variant: 'error', title: 'Report Failed', description: error.response?.data?.message || 'Could not submit report' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/app/profile/${targetId}`;
    navigator.clipboard.writeText(url);
    toast({ variant: 'success', title: 'Copied', description: "Profile link copied to clipboard" });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative z-[111] w-full max-w-sm glass-card border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {showReportInput ? (
            <form onSubmit={handleReportSubmit} className="p-5 space-y-4">
              <h3 className="font-bold text-base text-text-primary">Report @{user.username}</h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting (e.g. Spam, Harassment, Inappropriate)..."
                className="w-full p-3 rounded-xl bg-bg-surface/90 border border-border-soft text-text-primary text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportInput(false)}
                  className="flex-1 py-2.5 rounded-xl glass text-xs font-bold text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl hero-gradient text-white font-bold text-xs shadow-glow"
                >
                  Submit
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Block / Unblock Toggle */}
              <button 
                onClick={() => handleAction(localRelations.isBlocked ? 'Unblock' : 'Block', 'block')} 
                disabled={loading}
                className="w-full py-3.5 text-red-500 font-bold border-b border-border-soft/60 hover:bg-red-500/10 transition-colors"
              >
                {localRelations.isBlocked ? 'Unblock User' : 'Block User'}
              </button>

              {/* Restrict / Unrestrict Toggle */}
              <button 
                onClick={() => handleAction(localRelations.isRestricted ? 'Unrestrict' : 'Restrict', 'restrict')} 
                disabled={loading}
                className="w-full py-3.5 text-red-400 font-semibold border-b border-border-soft/60 hover:bg-white/5 transition-colors"
              >
                {localRelations.isRestricted ? 'Unrestrict User' : 'Restrict User'}
              </button>

              {/* Close Friends Toggle */}
              <button 
                onClick={() => handleAction(localRelations.isCloseFriend ? 'Remove Close Friend' : 'Add Close Friend', 'close-friends')} 
                disabled={loading}
                className="w-full py-3.5 text-emerald-400 font-semibold border-b border-border-soft/60 hover:bg-emerald-500/10 transition-colors"
              >
                {localRelations.isCloseFriend ? '⭐ Remove from Close Friends' : '⭐ Add to Close Friends'}
              </button>

              {/* Mute / Unmute Toggle */}
              <button 
                onClick={() => handleAction(localRelations.isMuted ? 'Unmute' : 'Mute', 'mute')} 
                disabled={loading}
                className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft/60 hover:bg-white/5 transition-colors"
              >
                {localRelations.isMuted ? 'Unmute User' : 'Mute User'}
              </button>

              {/* Hide Content */}
              <button 
                onClick={() => handleAction('Hide Content', 'hide-content')} 
                disabled={loading}
                className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft/60 hover:bg-white/5 transition-colors"
              >
                Hide User Content
              </button>

              {/* Report Profile */}
              <button 
                onClick={() => setShowReportInput(true)} 
                disabled={loading}
                className="w-full py-3.5 text-red-500 font-semibold border-b border-border-soft/60 hover:bg-red-500/10 transition-colors"
              >
                Report Profile
              </button>

              {/* Copy URL */}
              <button 
                onClick={handleCopyLink} 
                className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft/60 hover:bg-white/5 transition-colors"
              >
                Copy profile URL
              </button>

              {/* Cancel */}
              <button 
                onClick={onClose} 
                className="w-full py-3.5 text-text-secondary font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
