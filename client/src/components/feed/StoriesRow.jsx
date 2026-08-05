import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export const StoriesRow = ({ stories = [], liveStreams = [], isLoading, onStoryClick }) => {
  if (isLoading) {
    return (
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-3 sm:px-0 no-scrollbar snap-x-mandatory">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-bg-surface-hover animate-pulse" />
            <div className="w-10 sm:w-12 h-2.5 rounded bg-bg-surface-hover animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-3 sm:px-0 no-scrollbar snap-x-mandatory">

      {/* Current User — Add Story */}
      <Link
        to="/app/story/create"
        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group snap-start"
        aria-label="Create your story"
      >
        <div className="relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-bg-base group-hover:scale-105 transition-transform duration-300">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"
              alt="Your story"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-0.5 border-2 border-bg-base">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
        </div>
        <span className="text-[10px] sm:text-xs text-text-secondary font-medium">Your story</span>
      </Link>

      {/* Active Live Streams */}
      {liveStreams.map((stream) => (
        <Link
          to={`/app/live/${stream._id}`}
          key={`live-${stream._id}`}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer relative group snap-start"
          aria-label={`${stream.host.username} is live`}
        >
          <div className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-purple-500 p-[2px] animate-pulse">
            <div className="w-full h-full rounded-full border-2 border-bg-base overflow-hidden">
              <img
                src={stream.host.profilePicture || "https://i.pravatar.cc/150"}
                alt={stream.host.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="absolute top-[46px] sm:top-[52px] bg-red-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-bg-base shadow-sm">
            LIVE
          </div>
          <span className="text-[10px] sm:text-xs text-text-primary font-medium truncate w-14 sm:w-16 text-center mt-1.5 sm:mt-2">
            {stream.host.username}
          </span>
        </Link>
      ))}

      {/* Friends' Stories */}
      {stories.map((storyGroup, index) => (
        <motion.div
          whileTap={{ scale: 0.95 }}
          key={storyGroup.user._id}
          onClick={() => onStoryClick && onStoryClick(index)}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer snap-start"
          role="button"
          tabIndex={0}
          aria-label={`${storyGroup.user.username}'s story`}
          onKeyDown={(e) => e.key === 'Enter' && onStoryClick?.(index)}
        >
          <div className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-full hero-gradient p-[2px]">
            <div className="w-full h-full rounded-full border-2 border-bg-base overflow-hidden">
              <img
                src={storyGroup.user.profilePicture || "https://i.pravatar.cc/150"}
                alt={storyGroup.user.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-text-primary font-medium truncate w-14 sm:w-16 text-center">
            {storyGroup.user.username}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
