import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, useAnimation } from "framer-motion";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";
import { CommentModal } from "./CommentModal";
import { ShareModal } from "./ShareModal";
import { LikesModal } from "./LikesModal";
import { PostOptionsModal } from "../post/PostOptionsModal";
import { updateSavedPosts } from "../../store/authSlice";

// Modular Sub-components
import { PostHeader } from "./PostHeader";
import { PostMediaCarousel } from "./PostMediaCarousel";
import { PostActions } from "./PostActions";
import { PostCaption } from "./PostCaption";

export const PostCard = ({ post: initialPost, onPostDeleted }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(authUser?._id) || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [isSaved, setIsSaved] = useState(authUser?.savedPosts?.includes(post._id) || false);
  
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  
  const lastTap = useRef(0);
  const controls = useAnimation();

  // Normalise media array
  const mediaItems = post.media && post.media.length > 0 ? post.media : [{ url: post.mediaUrl, type: 'image' }];

  useEffect(() => {
    if (authUser?.savedPosts) {
      setIsSaved(authUser.savedPosts.includes(post._id));
    }
  }, [authUser?.savedPosts, post._id]);

  const handleDoubleTap = async (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    
    // Check for double tap (within 300ms) or direct double click event
    if ((tapLength < 300 && tapLength > 0) || e.type === 'dblclick') {
      if (e.preventDefault) e.preventDefault();
      
      if (!isLiked) {
        await handleLike();
      }
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 1000);
    }
    lastTap.current = currentTime;
  };

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    if (newIsLiked) {
      controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3 } });
    }

    try {
      await api.post(`/api/posts/${post._id}/like`);
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
      toast({ variant: "error", title: "Action Failed", description: "Could not update like." });
    }
  };

  const handleSave = async () => {
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);
    try {
      const res = await api.post(`/api/posts/${post._id}/save`);
      dispatch(updateSavedPosts(res.data.data));
    } catch (error) {
      setIsSaved(!newIsSaved);
      toast({ variant: "error", title: "Action Failed", description: "Could not save post." });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-bg-surface sm:rounded-[24px] border-y sm:border border-border-soft/60 shadow-md sm:shadow-lg hover:shadow-xl hover:border-primary-500/20 transition-all duration-300 overflow-hidden mb-6 sm:mb-8 md:mb-10"
    >
      <PostHeader 
        user={post.user} 
        location={post.location} 
        onShowOptions={() => setShowOptionsModal(true)} 
      />

      <PostMediaCarousel 
        mediaItems={mediaItems} 
        onDoubleTap={handleDoubleTap} 
        showHeartOverlay={showHeartOverlay}
      />
      
      <PostActions 
        isLiked={isLiked}
        isSaved={isSaved}
        onLike={handleLike}
        onSave={handleSave}
        onComment={() => setShowCommentModal(true)}
        onShare={() => setShowShareModal(true)}
        commentsEnabled={post.settings?.commentsEnabled}
        sharingEnabled={post.settings?.sharingEnabled}
        controls={controls}
        isCarousel={mediaItems.length > 1}
      />

      <PostCaption 
        post={post}
        likesCount={likesCount}
        commentsCount={commentsCount}
        onShowLikes={() => setShowLikesModal(true)}
      />
      
      {/* Modals */}
      {post.settings?.commentsEnabled !== false && (
        <CommentModal 
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          post={post}
          onCommentAdded={() => setCommentsCount(prev => prev + 1)}
          onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
        />
      )}

      {post.settings?.sharingEnabled !== false && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={post}
        />
      )}
      
      <LikesModal 
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        post={post}
      />

      <PostOptionsModal 
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        post={post}
        onPostDeleted={onPostDeleted}
        onPostUpdated={(updatedPost) => setPost(updatedPost)}
      />
    </motion.div>
  );
};
