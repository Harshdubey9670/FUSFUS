import { Link } from "react-router-dom";
import { RenderCaption } from "../../utils/renderCaption";

export const PostCaption = ({ 
  post, 
  likesCount, 
  commentsCount, 
  onShowLikes 
}) => {
  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
      {/* Likes Count */}
      {post.settings?.hideLikes ? (
        <p className="font-medium text-text-secondary text-sm mb-1">Liked by others</p>
      ) : (
        <button 
          onClick={() => likesCount > 0 && onShowLikes()}
          className="font-semibold text-text-primary text-sm mb-1 hover:text-text-secondary focus:outline-none transition-colors"
        >
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </button>
      )}

      {/* Caption */}
      <div className="text-sm">
        <span className="font-semibold text-text-primary mr-2">{post.user?.username}</span>
        <RenderCaption caption={post.caption} />
      </div>

      {/* View Comments Link */}
      {post.settings?.commentsEnabled !== false && (
        <Link 
          to={`/app/post/${post._id}`}
          className="text-text-secondary text-sm mt-1 mb-1 block hover:text-text-primary transition-colors"
        >
          {commentsCount > 0 ? `View all ${commentsCount} comments` : 'View full post & details'}
        </Link>
      )}
      
      {/* Timestamp */}
      <p className="text-text-secondary text-[10px] uppercase mt-1 tracking-wide">
        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
};
