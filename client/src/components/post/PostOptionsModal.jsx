import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { cn } from "../../utils/cn";
import { useToast } from "../ui/Toast";
import api from "../../services/api";
import { EditPostModal } from "./EditPostModal";
import { useState } from "react";

export const PostOptionsModal = ({ isOpen, onClose, post, onPostDeleted, onPostUpdated }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (typeof document === "undefined") return null;

  const isOwner = authUser?._id === post.user?._id;
  const isArchived = post.status === 'archived';
  const isPinned = post.isPinned;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/api/posts/${post._id}`);
      showToast("Post deleted", "success");
      onClose();
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (error) {
      showToast("Failed to delete post", "error");
    }
  };

  const handleToggleArchive = async () => {
    try {
      const res = await api.put(`/api/posts/${post._id}/archive`);
      showToast(isArchived ? "Post unarchived" : "Post archived", "success");
      onClose();
      if (onPostUpdated) onPostUpdated(res.data.data);
    } catch (error) {
      showToast("Failed to archive post", "error");
    }
  };

  const handleTogglePin = async () => {
    try {
      const res = await api.put(`/api/posts/${post._id}/pin`);
      showToast(isPinned ? "Post unpinned" : "Post pinned", "success");
      onClose();
      if (onPostUpdated) onPostUpdated(res.data.data);
    } catch (error) {
      showToast("Failed to pin post", "error");
    }
  };

  const handleToggleComments = async () => {
    try {
      const currentCommentsEnabled = post.settings?.commentsEnabled ?? true;
      const res = await api.put(`/api/posts/${post._id}/settings`, { commentsEnabled: !currentCommentsEnabled });
      showToast(currentCommentsEnabled ? "Comments turned off" : "Comments turned on", "success");
      onClose();
      if (onPostUpdated) onPostUpdated(res.data.data);
    } catch (error) {
      showToast("Failed to update post settings", "error");
    }
  };

  const handleToggleLikes = async () => {
    try {
      const currentHideLikes = post.settings?.hideLikes ?? false;
      const res = await api.put(`/api/posts/${post._id}/settings`, { hideLikes: !currentHideLikes });
      showToast(currentHideLikes ? "Like counts visible" : "Like counts hidden", "success");
      onClose();
      if (onPostUpdated) onPostUpdated(res.data.data);
    } catch (error) {
      showToast("Failed to update post settings", "error");
    }
  };

  const handleHide = async () => {
    try {
      await api.post(`/api/posts/${post._id}/hide`);
      showToast("Post hidden from your feed", "success");
      onClose();
      if (onPostDeleted) onPostDeleted(post._id); // Hiding visually acts like deleting for the current user
    } catch (error) {
      showToast("Failed to hide post", "error");
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this post? (spam, nudity, hate_speech, violence, bullying, other)", "spam");
    if (!reason) return;
    try {
      await api.post(`/api/posts/${post._id}/report`, { reason });
      showToast("Post reported. We will review it shortly.", "success");
      onClose();
    } catch (error) {
      showToast("Failed to report post", "error");
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/app/post/${post._id}`;
    navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard", "success");
    onClose();
  };

  return createPortal(
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-[111] w-full max-w-sm bg-bg-base rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {isOwner ? (
              <>
                <button onClick={handleDelete} className="w-full py-3.5 text-red-500 font-bold border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  Delete
                </button>
                <button onClick={handleToggleArchive} className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  {isArchived ? "Show on profile" : "Archive"}
                </button>
                <button onClick={handleTogglePin} className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  {isPinned ? "Unpin from profile" : "Pin to your profile"}
                </button>
                <button onClick={handleToggleComments} className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  {post.settings?.commentsEnabled === false ? "Turn on commenting" : "Turn off commenting"}
                </button>
                <button onClick={handleToggleLikes} className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  {post.settings?.hideLikes ? "Unhide like count" : "Hide like count"}
                </button>
                <button onClick={() => setIsEditModalOpen(true)} className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  Edit
                </button>
              </>
            ) : (
              <>
                <button onClick={handleReport} className="w-full py-3.5 text-red-500 font-bold border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  Report
                </button>
                <button onClick={handleHide} className="w-full py-3.5 text-red-500 font-bold border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
                  Hide
                </button>
              </>
            )}
            <button onClick={handleCopyLink} className="w-full py-3.5 text-text-primary font-medium border-b border-border-soft hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
              Copy link
            </button>
            <button onClick={onClose} className="w-full py-3.5 text-text-primary font-medium hover:bg-bg-surface transition-colors active:bg-bg-surface-hover">
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    <EditPostModal 
      isOpen={isEditModalOpen} 
      onClose={() => {
        setIsEditModalOpen(false);
        onClose();
      }} 
      post={post} 
      onPostUpdated={onPostUpdated} 
    />
    </>,
    document.body
  );
};
