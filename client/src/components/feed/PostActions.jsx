import { motion } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { cn } from "../../utils/cn";

export const PostActions = ({ 
  isLiked, 
  isSaved, 
  onLike, 
  onSave, 
  onComment, 
  onShare, 
  commentsEnabled, 
  sharingEnabled, 
  controls,
  isCarousel
}) => {
  return (
    <div className={cn("px-3 sm:px-4 pb-1 sm:pb-2", isCarousel ? "pt-1" : "pt-3 sm:pt-4")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.button 
            animate={controls}
            onClick={onLike}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 focus:outline-none transition-colors"
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <Heart 
              className={cn("w-6 h-6 sm:w-7 sm:h-7", isLiked ? "text-red-500 fill-red-500" : "text-text-primary hover:text-text-secondary")} 
              aria-hidden="true"
            />
          </motion.button>
          
          {commentsEnabled !== false && (
            <button 
              onClick={onComment}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors focus:outline-none"
              aria-label="Comment on post"
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
            </button>
          )}
          
          {sharingEnabled !== false && (
            <button 
              onClick={onShare}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors focus:outline-none"
              aria-label="Share post"
            >
              <Send className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
            </button>
          )}
        </div>
        <button 
          onClick={onSave} 
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 focus:outline-none transition-colors" 
          aria-label={isSaved ? "Remove bookmark" : "Bookmark post"}
        >
          <Bookmark 
            className={cn("w-6 h-6 sm:w-7 sm:h-7", isSaved ? "text-primary-500 fill-primary-500" : "text-text-primary hover:text-text-secondary")} 
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
};
