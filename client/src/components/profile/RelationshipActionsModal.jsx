import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ShieldAlert, 
  VolumeX, 
  EyeOff, 
  Star, 
  Flag, 
  UserX, 
  X, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../ui/Toast';
import { 
  updateBlockedUsers, 
  updateMutedUsers, 
  updateRestrictedUsers, 
  updateCloseFriends, 
  updateFollowing 
} from '../../store/authSlice';

export const RelationshipActionsModal = ({ isOpen, onClose, targetUser, onActionComplete }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [loadingAction, setLoadingAction] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  const targetId = (targetUser?._id || targetUser?.id)?.toString();

  // Local reactive states
  const [relations, setRelations] = useState({
    isBlocked: false,
    isMuted: false,
    isRestricted: false,
    isCloseFriend: false,
  });

  useEffect(() => {
    if (isOpen && targetUser && targetId) {
      setRelations({
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
  }, [isOpen, targetUser, targetId, authUser]);

  if (!isOpen || !targetUser) return null;

  const targetUsername = targetUser.username || 'User';

  const handleAction = async (actionType, endpoint, successMsg) => {
    setLoadingAction(actionType);

    // Optimistic toggle
    if (actionType === 'block') setRelations(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
    if (actionType === 'restrict') setRelations(prev => ({ ...prev, isRestricted: !prev.isRestricted }));
    if (actionType === 'mute') setRelations(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (actionType === 'closeFriends') setRelations(prev => ({ ...prev, isCloseFriend: !prev.isCloseFriend }));

    try {
      const res = await api.post(endpoint);
      
      // Update Redux state with fresh server arrays
      if (res.data?.blockedUsers) dispatch(updateBlockedUsers(res.data.blockedUsers));
      if (res.data?.restrictedUsers) dispatch(updateRestrictedUsers(res.data.restrictedUsers));
      if (res.data?.mutedUsers) dispatch(updateMutedUsers(res.data.mutedUsers));
      if (res.data?.closeFriends) dispatch(updateCloseFriends(res.data.closeFriends));
      if (res.data?.following) dispatch(updateFollowing(res.data.following));

      // Update boolean states strictly from response if available
      if (typeof res.data?.isBlocked === 'boolean') setRelations(prev => ({ ...prev, isBlocked: res.data.isBlocked }));
      if (typeof res.data?.isRestricted === 'boolean') setRelations(prev => ({ ...prev, isRestricted: res.data.isRestricted }));
      if (typeof res.data?.isMuted === 'boolean') setRelations(prev => ({ ...prev, isMuted: res.data.isMuted }));
      if (typeof res.data?.isCloseFriend === 'boolean') setRelations(prev => ({ ...prev, isCloseFriend: res.data.isCloseFriend }));

      toast({ variant: 'success', title: 'Success', description: res.data?.message || successMsg });
      if (onActionComplete) onActionComplete(actionType);
    } catch (err) {
      // Revert optimistic toggle on failure
      if (actionType === 'block') setRelations(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
      if (actionType === 'restrict') setRelations(prev => ({ ...prev, isRestricted: !prev.isRestricted }));
      if (actionType === 'mute') setRelations(prev => ({ ...prev, isMuted: !prev.isMuted }));
      if (actionType === 'closeFriends') setRelations(prev => ({ ...prev, isCloseFriend: !prev.isCloseFriend }));

      toast({
        variant: 'error',
        title: 'Action Failed',
        description: err.response?.data?.message || 'Failed to update status'
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    
    setLoadingAction('report');
    try {
      const res = await api.post(`/api/users/${targetId}/report`, { reason: reportReason });
      if (res.data?.success) {
        toast({ variant: 'success', title: 'Report Submitted', description: res.data.message });
        setShowReportForm(false);
        setReportReason('');
        onClose();
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Report Failed', description: err.response?.data?.message || 'Could not submit report' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm glass-card rounded-3xl border border-white/20 p-6 space-y-4 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              @{targetUsername} Options
            </h3>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showReportForm ? (
            <form onSubmit={submitReport} className="space-y-4 pt-2">
              <h4 className="font-semibold text-sm text-text-primary">Report @{targetUsername}</h4>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting (e.g. Spam, Harassment, Fake Account)..."
                className="w-full p-3 rounded-xl bg-bg-surface/80 border border-border-soft text-text-primary text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="flex-1 py-2.5 rounded-xl glass text-xs font-bold text-text-secondary hover:text-text-primary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'report'}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  {loadingAction === 'report' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 pt-1">
              {/* Block / Unblock Toggle */}
              <button
                onClick={() => handleAction('block', `/api/users/${targetId}/block`, 'Block status updated')}
                disabled={loadingAction !== null}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  relations.isBlocked 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                    : 'glass border-red-500/30 text-red-400 hover:bg-red-500/10'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  {relations.isBlocked ? 'Unblock User' : 'Block User'}
                </span>
                {loadingAction === 'block' ? <Loader2 className="w-4 h-4 animate-spin" /> : relations.isBlocked && <CheckCircle2 className="w-4 h-4" />}
              </button>

              {/* Restrict / Unrestrict Toggle */}
              <button
                onClick={() => handleAction('restrict', `/api/users/${targetId}/restrict`, 'Restrict status updated')}
                disabled={loadingAction !== null}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  relations.isRestricted 
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400' 
                    : 'glass border-white/10 text-text-primary hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  {relations.isRestricted ? 'Unrestrict User' : 'Restrict User'}
                </span>
                {loadingAction === 'restrict' ? <Loader2 className="w-4 h-4 animate-spin" /> : relations.isRestricted && <CheckCircle2 className="w-4 h-4" />}
              </button>

              {/* Close Friends Toggle */}
              <button
                onClick={() => handleAction('closeFriends', `/api/users/${targetId}/close-friends`, 'Close Friends status updated')}
                disabled={loadingAction !== null}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  relations.isCloseFriend 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                    : 'glass border-white/10 text-text-primary hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Star className={`w-4 h-4 ${relations.isCloseFriend ? 'fill-emerald-400 text-emerald-400' : 'text-emerald-400'}`} />
                  {relations.isCloseFriend ? 'Remove from Close Friends' : '⭐ Add to Close Friends'}
                </span>
                {loadingAction === 'closeFriends' ? <Loader2 className="w-4 h-4 animate-spin" /> : relations.isCloseFriend && <CheckCircle2 className="w-4 h-4" />}
              </button>

              {/* Mute / Unmute Toggle */}
              <button
                onClick={() => handleAction('mute', `/api/users/${targetId}/mute`, 'Mute status updated')}
                disabled={loadingAction !== null}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  relations.isMuted 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                    : 'glass border-white/10 text-text-primary hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <VolumeX className="w-4 h-4 text-amber-400" />
                  {relations.isMuted ? 'Unmute User' : 'Mute User'}
                </span>
                {loadingAction === 'mute' ? <Loader2 className="w-4 h-4 animate-spin" /> : relations.isMuted && <CheckCircle2 className="w-4 h-4" />}
              </button>

              {/* Hide Content */}
              <button
                onClick={() => handleAction('hide', `/api/users/${targetId}/hide-content`, 'Content hidden from feed')}
                disabled={loadingAction !== null}
                className="w-full p-3 rounded-2xl glass border border-white/10 text-xs font-bold text-text-primary hover:bg-white/10 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <UserX className="w-4 h-4 text-secondary-400" />
                  Hide User Content
                </span>
                {loadingAction === 'hide' && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>

              {/* Report Button */}
              <button
                onClick={() => setShowReportForm(true)}
                disabled={loadingAction !== null}
                className="w-full p-3 rounded-2xl glass border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-all"
              >
                <Flag className="w-4 h-4 text-red-400" />
                Report Profile
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
