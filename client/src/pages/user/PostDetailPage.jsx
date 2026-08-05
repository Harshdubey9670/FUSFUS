import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Sparkles, 
  Smile, 
  MapPin, 
  Check, 
  Copy, 
  ShieldAlert, 
  Trash2, 
  Archive,
  ArchiveRestore,
  Pin, 
  BadgeCheck, 
  Loader2,
  BarChart2,
  Edit3,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import API from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { MentionTextarea } from '../../components/feed/MentionTextarea';

export default function PostDetailPage() {
  const { id: targetPostId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: authUser } = useSelector(state => state.auth);

  // Origin Navigation Context (Profile, Feed, or Explore)
  const navState = location.state || {};
  const originSource = navState.source || 'explore';
  const originUserId = navState.userId;

  // Main Target Post State
  const [targetPost, setTargetPost] = useState(null);
  const [targetLoading, setTargetLoading] = useState(true);

  // Infinite Scroll Stream State
  const [feedPosts, setFeedPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  
  // Prefetched Cache for smooth scrolling
  const prefetchedCacheRef = useRef({});
  const observerRef = useRef(null);

  // Edit & Share Modals
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load Main Target Post & Initial Feed Stream
  useEffect(() => {
    fetchTargetPost();
    setFeedPosts([]);
    setPage(1);
    setHasMore(true);
    prefetchedCacheRef.current = {};
    fetchMorePosts(1, true);
  }, [targetPostId, originSource, originUserId]);

  const fetchTargetPost = async () => {
    try {
      setTargetLoading(true);
      const res = await API.get(`/api/posts/${targetPostId}`);
      if (res.data.success) {
        setTargetPost(res.data.data);
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load post details.' });
    } finally {
      setTargetLoading(false);
    }
  };

  // Fetch Stream Posts based on Source Context (Profile feed, Home feed, or Explore)
  const fetchMorePosts = async (pageNum, reset = false) => {
    try {
      setFeedLoading(true);
      let endpoint = '/api/posts/explore';
      let params = { page: pageNum, limit: 6 };

      if (originSource === 'profile' && originUserId) {
        endpoint = `/api/posts/user/${originUserId}`;
      } else if (originSource === 'feed') {
        endpoint = '/api/posts/feed';
      }

      // Check if already prefetched
      let fetched = [];
      if (prefetchedCacheRef.current[pageNum]) {
        fetched = prefetchedCacheRef.current[pageNum];
      } else {
        const res = await API.get(endpoint, { params });
        if (res.data.success) {
          fetched = res.data.data?.posts || res.data.data || [];
        }
      }

      // Filter out target post if present
      const filtered = fetched.filter(p => p._id !== targetPostId);
      setFeedPosts(prev => reset ? filtered : [...prev, ...filtered]);
      if (fetched.length < 6) setHasMore(false);

      // PREFETCH NEXT BATCH FOR SMOOTH INFINITE SCROLLING
      if (hasMore) {
        prefetchNextBatch(endpoint, pageNum + 1);
      }
    } catch (e) {
      console.error('Failed to load related posts feed', e);
    } finally {
      setFeedLoading(false);
    }
  };

  const prefetchNextBatch = async (endpoint, nextPage) => {
    if (prefetchedCacheRef.current[nextPage]) return;
    try {
      const res = await API.get(endpoint, { params: { page: nextPage, limit: 6 } });
      if (res.data.success) {
        prefetchedCacheRef.current[nextPage] = res.data.data?.posts || res.data.data || [];
      }
    } catch (e) {}
  };

  // Intersection Observer for Continuous Infinite Scroll
  const lastPostElementRef = useCallback(node => {
    if (feedLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchMorePosts(nextPage);
          return nextPage;
        });
      }
    });

    if (node) observerRef.current.observe(node);
  }, [feedLoading, hasMore]);

  // Handle Back Button & Preserve Scroll Position
  const handleBack = () => {
    navigate(-1);
  };

  // Actions: Archive Toggle
  const handleToggleArchive = async (postItem) => {
    try {
      const res = await API.put(`/api/posts/${postItem._id}/archive`);
      if (res.data.success) {
        const nextStatus = res.data.data.status;
        const isArchivedNow = nextStatus === 'archived';

        toast({
          variant: 'success',
          title: isArchivedNow ? 'Post Archived' : 'Post Restored',
          description: isArchivedNow ? 'Moved post to your private Archive.' : 'Restored post to your Profile feed.'
        });

        if (targetPost && targetPost._id === postItem._id) {
          setTargetPost(prev => ({ ...prev, status: nextStatus }));
        }
        setFeedPosts(prev => prev.map(p => p._id === postItem._id ? { ...p, status: nextStatus } : p));
      }
    } catch (e) {
      toast({ variant: 'error', title: 'Failed to archive post' });
    }
  };

  // Actions: Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      const res = await API.delete(`/api/posts/${postId}`);
      if (res.data.success) {
        toast({ variant: 'success', title: 'Post Deleted', description: 'Removed from Database, Feed, and Profile.' });
        if (targetPost && targetPost._id === postId) {
          navigate(-1);
        } else {
          setFeedPosts(prev => prev.filter(p => p._id !== postId));
        }
      }
    } catch (e) {
      toast({ variant: 'error', title: 'Delete Failed' });
    }
  };

  // Actions: Save Edit Post
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setIsUpdatingPost(true);
    try {
      const res = await API.put(`/api/posts/${editingPost._id}`, {
        caption: editCaption,
        location: editLocation
      });
      if (res.data.success) {
        toast({ variant: 'success', title: 'Post Updated' });
        const updatedData = res.data.data;
        if (targetPost && targetPost._id === editingPost._id) {
          setTargetPost(prev => ({ ...prev, caption: updatedData.caption, location: updatedData.location }));
        }
        setFeedPosts(prev => prev.map(p => p._id === editingPost._id ? { ...p, caption: updatedData.caption, location: updatedData.location } : p));
        setEditingPost(null);
      }
    } catch (e) {
      toast({ variant: 'error', title: 'Failed to update post' });
    } finally {
      setIsUpdatingPost(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pb-safe-24 lg:pb-8 pt-2 sm:pt-4 px-0 sm:px-2 md:px-0 max-w-full md:max-w-[470px] lg:max-w-[500px] mx-auto space-y-4 sm:space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-white/10 shadow-lg sticky top-2 z-40 backdrop-blur-md">
        <button onClick={handleBack} className="p-2 rounded-full hover:bg-bg-surface text-text-secondary hover:text-text-primary">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black hero-text">
          {originSource === 'profile' ? 'Profile Posts Stream' : 'Explore Post Stream'}
        </h1>
        <div className="w-10" />
      </div>

      {/* 1. MAIN SELECTED TARGET POST AT TOP */}
      {targetLoading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      ) : targetPost ? (
        <InstagramPostCard 
          post={targetPost} 
          isMain={true}
          authUser={authUser}
          onArchive={handleToggleArchive}
          onDelete={handleDeletePost}
          onEdit={(p) => { setEditingPost(p); setEditCaption(p.caption || ''); setEditLocation(p.location || ''); }}
          onShare={(p) => setSharePost(p)}
        />
      ) : (
        <div className="text-center py-12 text-text-secondary">Post not found</div>
      )}

      {/* SEPARATOR: MORE POSTS IN STREAM */}
      <div className="border-t border-border-soft pt-6 space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
          <h2 className="text-lg font-bold text-text-primary">More from {originSource === 'profile' ? 'this Creator' : 'Feed'}</h2>
        </div>
        <p className="text-xs text-text-secondary">Keep scrolling to view more posts without going back.</p>
      </div>

      {/* 2. INFINITE SCROLLING FEED STREAM BELOW TARGET POST */}
      <div className="space-y-8">
        {feedPosts.map((postItem, idx) => {
          const isLast = idx === feedPosts.length - 1;
          return (
            <div key={postItem._id} ref={isLast ? lastPostElementRef : null}>
              <InstagramPostCard 
                post={postItem} 
                isMain={false}
                authUser={authUser}
                onArchive={handleToggleArchive}
                onDelete={handleDeletePost}
                onEdit={(p) => { setEditingPost(p); setEditCaption(p.caption || ''); setEditLocation(p.location || ''); }}
                onShare={(p) => setSharePost(p)}
              />
            </div>
          );
        })}

        {feedLoading && (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}
      </div>

      {/* EDIT POST MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary-500" /> Edit Post Details
              </h3>
              <button onClick={() => setEditingPost(null)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary">Caption</label>
                <MentionTextarea 
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full p-3 rounded-xl bg-bg-surface border border-border-soft text-sm text-text-primary min-h-[100px] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary">Location Tag</label>
                <input 
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full p-3 rounded-xl bg-bg-surface border border-border-soft text-sm text-text-primary mt-1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setEditingPost(null)} variant="ghost" className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleSaveEdit} variant="gradient" className="flex-1 rounded-xl" isLoading={isUpdatingPost}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 rounded-3xl space-y-4 text-center">
            <h3 className="font-bold text-lg text-text-primary">Share Post</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + `/app/post/${sharePost._id}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  toast({ variant: 'success', title: 'Link Copied to Clipboard!' });
                }}
                className="py-3 rounded-2xl glass text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied Link!' : 'Copy Direct Link'}
              </button>

              <button 
                onClick={() => {
                  navigate(`/app/chat`);
                  toast({ variant: 'info', title: 'Select chat partner to share post' });
                }}
                className="py-3 rounded-2xl hero-gradient text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send in Direct Chat
              </button>

              <button onClick={() => setSharePost(null)} className="py-2 text-xs text-text-secondary font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Component: Instagram Style Post Card ── */
function InstagramPostCard({ post, isMain, authUser, onArchive, onDelete, onEdit, onShare }) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || post.likes?.length || 0);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = authUser?._id === post.user?._id || authUser?._id === post.user;
  const isArchived = post.status === 'archived';

  useEffect(() => {
    fetchComments();
  }, [post._id]);

  const fetchComments = async () => {
    try {
      const res = await API.get(`/api/posts/${post._id}/comments`);
      if (res.data.success) setComments(res.data.data || []);
    } catch (e) {}
  };

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await API.post(`/api/posts/${post._id}/like`);
    } catch (e) {
      setLiked(!nextLiked);
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    try {
      await API.post(`/api/posts/${post._id}/save`);
      toast({ variant: 'success', title: nextSaved ? 'Saved to Bookmarks' : 'Removed from Bookmarks' });
    } catch (e) {
      setSaved(!nextSaved);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const text = newComment;
    setNewComment('');
    setShowEmojiPicker(false);

    try {
      const res = await API.post(`/api/posts/${post._id}/comments`, { text });
      if (res.data.success) {
        setComments(prev => [res.data.data, ...prev]);
      }
    } catch (e) {
      toast({ variant: 'error', title: 'Failed to add comment' });
    }
  };

  const mediaList = post.media || [{ url: post.mediaUrl, type: post.mediaType || 'image' }];

  return (
    <div className={`glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-bg-surface ${isMain ? 'ring-2 ring-primary-500/50' : ''}`}>
      
      {/* Top Author & Menu Bar */}
      <div className="p-4 flex items-center justify-between border-b border-border-soft">
        <Link to={`/app/profile/${post.user?._id}`} className="flex items-center gap-3">
          <Avatar src={post.user?.profilePicture || post.user?.avatar} className="w-10 h-10 border border-primary-500" />
          <div>
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-1">
              @{post.user?.username || 'user'} {post.user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20" />}
            </h3>
            {post.location && (
              <span className="text-[11px] text-text-secondary flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary-400" /> {post.location}
              </span>
            )}
          </div>
        </Link>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-bg-base text-text-secondary">
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-bg-base border border-border-soft rounded-2xl p-2 shadow-2xl z-30 space-y-1">
              {isOwner && (
                <>
                  <button onClick={() => { onEdit(post); setShowMenu(false); }} className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-bg-surface flex items-center gap-2 text-text-primary">
                    <Edit3 className="w-4 h-4" /> Edit Post
                  </button>
                  
                  <button onClick={() => { onArchive(post); setShowMenu(false); }} className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-bg-surface flex items-center gap-2 text-amber-400">
                    {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    {isArchived ? 'Unarchive' : 'Archive'}
                  </button>

                  <button onClick={() => { onDelete(post._id); setShowMenu(false); }} className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-bg-surface flex items-center gap-2 text-red-500">
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                </>
              )}
              <button onClick={() => { onShare(post); setShowMenu(false); }} className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-bg-surface flex items-center gap-2 text-text-primary">
                <Share2 className="w-4 h-4" /> Share Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Media Carousel */}
      <div className="relative aspect-[4/5] bg-black flex items-center justify-center">
        {mediaList[activeMediaIndex]?.type === 'video' ? (
          <DetailVideoPlayer src={mediaList[activeMediaIndex].url} />
        ) : (
          <img src={mediaList[activeMediaIndex]?.url} alt="Post Media" className="w-full h-full object-contain" />
        )}

        {mediaList.length > 1 && (
          <>
            {activeMediaIndex > 0 && (
              <button onClick={() => setActiveMediaIndex(prev => prev - 1)} className="absolute left-3 p-2 rounded-full glass text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeMediaIndex < mediaList.length - 1 && (
              <button onClick={() => setActiveMediaIndex(prev => prev + 1)} className="absolute right-3 p-2 rounded-full glass text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Interaction Toolbar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={`transition-transform active:scale-125 ${liked ? 'text-red-500' : 'text-text-primary'}`}>
              <Heart className={`w-6 h-6 ${liked ? 'fill-red-500' : ''}`} />
            </button>
            <button onClick={() => onShare(post)} className="text-text-primary hover:text-primary-400">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          <button onClick={handleSave} className={`transition-colors ${saved ? 'text-primary-500' : 'text-text-primary'}`}>
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-primary-500' : ''}`} />
          </button>
        </div>

        <div className="font-bold text-sm text-text-primary">{likesCount} Likes</div>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm text-text-primary leading-relaxed">
            <span className="font-bold mr-2">@{post.user?.username}</span>
            {post.caption}
          </div>
        )}

        {/* Comments Feed List */}
        <div className="pt-2 border-t border-border-soft space-y-3 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c._id} className="flex items-start gap-2.5 text-xs">
              <Avatar src={c.user?.profilePicture} className="w-7 h-7 mt-0.5" />
              <div className="flex-1 bg-bg-base p-2.5 rounded-2xl border border-border-soft">
                <span className="font-bold text-text-primary block mb-0.5">@{c.user?.username}</span>
                <p className="text-text-secondary">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-text-secondary hover:text-text-primary">
            <Smile className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 py-2 px-3 rounded-full bg-bg-base border border-border-soft text-xs text-text-primary focus:outline-none"
          />
          <button type="submit" disabled={!newComment.trim()} className="text-xs font-bold text-primary-500 disabled:opacity-40">
            Post
          </button>
        </form>

        {showEmojiPicker && (
          <div className="absolute z-40">
            <EmojiPicker onEmojiClick={(e) => setNewComment(prev => prev + e.emoji)} />
          </div>
        )}
      </div>

    </div>
  );
}

function DetailVideoPlayer({ src }) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer group" onClick={toggleMute}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-contain"
      />
      <button 
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all z-20 shadow-lg border border-white/10"
        title={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
      </button>
    </div>
  );
}
