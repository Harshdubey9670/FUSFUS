import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../ui/Toast";
import { FollowButton } from "../profile/FollowButton";

export const LikesModal = ({ post, isOpen, onClose }) => {
  const { toast } = useToast();
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && post) {
      fetchLikes();
    }
  }, [isOpen, post]);

  const fetchLikes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/posts/${post._id}/likes`);
      setLikes(res.data.data);
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Could not load likes" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm max-h-[70vh] flex flex-col bg-bg-surface rounded-2xl border border-border-soft overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-soft">
            <h2 className="text-lg font-bold text-text-primary text-center w-full">Likes</h2>
            <button onClick={onClose} className="absolute right-4 p-1 text-text-secondary hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Likes List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : likes.length === 0 ? (
              <div className="text-center p-8 text-text-secondary flex flex-col items-center h-full justify-center">
                <p>No likes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {likes.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <Link to={`/app/profile/${user._id}`} className="flex items-center gap-3 min-w-0" onClick={onClose}>
                      <img 
                        src={user.profilePicture || user.avatar || "https://i.pravatar.cc/150"} 
                        alt={user.username} 
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-text-primary text-sm truncate">{user.username}</span>
                        <span className="text-xs text-text-secondary truncate">{user.fullName || user.category}</span>
                      </div>
                    </Link>
                    <div className="ml-3 shrink-0">
                      <FollowButton userId={user._id} targetUser={user} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
