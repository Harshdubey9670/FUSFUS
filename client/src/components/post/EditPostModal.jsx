import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2 } from "lucide-react";
import { useToast } from "../ui/Toast";
import api from "../../services/api";

export const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [caption, setCaption] = useState(post?.caption || "");
  const [location, setLocation] = useState(post?.location || "");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (typeof document === "undefined") return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/api/posts/${post._id}`, { caption, location });
      showToast("Post updated successfully", "success");
      if (onPostUpdated) onPostUpdated(res.data.data);
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update post", "error");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            className="relative z-[121] w-full max-w-md bg-bg-base rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-soft">
              <h2 className="text-lg font-bold text-text-primary hero-text">Edit Info</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-bg-surface transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6 text-text-secondary hover:text-text-primary transition-colors" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Media Preview (Thumbnail) */}
              {post?.media?.length > 0 && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-border-soft shrink-0 mb-4 mx-auto">
                  {post.media[0].type === "video" ? (
                    <video src={post.media[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.media[0].url} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full h-24 p-3 bg-bg-surface border border-border-soft rounded-xl text-text-primary focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  maxLength={2200}
                />
                <div className="text-right text-xs text-text-secondary mt-1">
                  {caption?.length || 0}/2200
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="w-full pl-9 pr-4 py-2.5 bg-bg-surface border border-border-soft rounded-xl text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-soft">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-surface transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (caption === post?.caption && location === post?.location)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white hero-gradient shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Done"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
