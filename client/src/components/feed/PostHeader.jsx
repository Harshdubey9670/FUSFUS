import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";

export const PostHeader = ({ user, location, onShowOptions }) => {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <Link to={`/app/profile/${user?._id}`} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hero-gradient p-[2px]">
            <img 
              src={user?.profilePicture || "https://i.pravatar.cc/150"} 
              alt={user?.username} 
              className="w-full h-full rounded-full border-2 border-bg-surface object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base text-text-primary group-hover:text-text-secondary transition-colors leading-none">
              {user?.username}
            </span>
            {location && (
              <span className="text-xs text-text-secondary mt-1 leading-none">{location}</span>
            )}
          </div>
        </Link>
      </div>
      <button 
        onClick={onShowOptions} 
        className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none p-1" 
        aria-label="Post options"
      >
        <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
};
