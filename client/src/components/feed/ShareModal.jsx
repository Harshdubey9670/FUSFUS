import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Share2, Check, MessageCircle, Copy, Globe, Send } from "lucide-react";
import { useToast } from "../ui/Toast";

const shareOptions = [
  {
    id: "native",
    label: "Share via…",
    icon: Share2,
    color: "text-primary-500",
    bg: "bg-primary-500/10 hover:bg-primary-500/20",
    available: () => typeof navigator !== "undefined" && !!navigator.share,
  },
  {
    id: "copy",
    label: "Copy link",
    icon: Link2,
    color: "text-text-primary",
    bg: "bg-bg-surface-hover hover:bg-border-soft",
    available: () => true,
  },
  {
    id: "twitter",
    label: "Share to X",
    icon: Globe,
    color: "text-sky-400",
    bg: "bg-sky-400/10 hover:bg-sky-400/20",
    available: () => true,
  },
  {
    id: "facebook",
    label: "Share to Facebook",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    available: () => true,
  },
  {
    id: "whatsapp",
    label: "Share to WhatsApp",
    icon: MessageCircle,
    color: "text-green-400",
    bg: "bg-green-400/10 hover:bg-green-400/20",
    available: () => true,
  },
];

export const ShareModal = ({ isOpen, onClose, post }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const postUrl = `${window.location.origin}/app/profile/${post.user?._id}`;
  const postTitle = post.caption
    ? `${post.user?.username}: ${post.caption.slice(0, 80)}${post.caption.length > 80 ? "…" : ""}`
    : `Post by @${post.user?.username}`;
  const postImage = post.media?.[0]?.url;

  const handleShare = async (optionId) => {
    switch (optionId) {
      case "native":
        try {
          await navigator.share({
            title: postTitle,
            text: post.caption || "",
            url: postUrl,
          });
          onClose();
        } catch (err) {
          if (err.name !== "AbortError") {
            toast({ variant: "error", title: "Share failed", description: "Could not open share dialog." });
          }
        }
        break;

      case "copy":
        try {
          await navigator.clipboard.writeText(postUrl);
          setCopied(true);
          toast({ variant: "success", title: "Link copied!", description: "Post link copied to clipboard." });
          setTimeout(() => setCopied(false), 2500);
        } catch {
          toast({ variant: "error", title: "Failed", description: "Could not copy link." });
        }
        break;

      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`,
          "_blank",
          "noopener,noreferrer"
        );
        onClose();
        break;

      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
        onClose();
        break;

      case "whatsapp":
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(postTitle + " " + postUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
        onClose();
        break;

      default:
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:relative md:inset-auto md:top-auto"
          >
            <div className="bg-bg-surface border border-border-soft rounded-t-3xl md:rounded-3xl p-6 max-w-md mx-auto w-full shadow-2xl">
              {/* Handle bar (mobile) */}
              <div className="w-10 h-1 rounded-full bg-border-soft mx-auto mb-5 md:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-text-primary">Share Post</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-bg-surface-hover transition-colors text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Post preview strip */}
              <div className="flex items-center gap-3 p-3 bg-bg-surface-hover rounded-2xl mb-5 border border-border-soft">
                {postImage && (
                  <img
                    src={postImage}
                    alt="Post preview"
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">@{post.user?.username}</p>
                  {post.caption && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">{post.caption}</p>
                  )}
                </div>
              </div>

              {/* Copy Link bar */}
              <div className="flex items-center gap-2 p-3 bg-bg-surface-hover rounded-2xl mb-5 border border-border-soft">
                <Link2 className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span className="flex-1 text-sm text-text-secondary truncate">{postUrl}</span>
                <button
                  onClick={() => handleShare("copy")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-primary-500 hover:bg-primary-600 text-white"
                  }`}
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </button>
              </div>

              {/* Share Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                {shareOptions
                  .filter(opt => opt.id !== "copy" && opt.available())
                  .map(opt => {
                    const Icon = opt.icon;
                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleShare(opt.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl transition-colors ${opt.bg}`}
                      >
                        <div className={`p-2 rounded-xl bg-bg-surface ${opt.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-text-primary">{opt.label}</span>
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
