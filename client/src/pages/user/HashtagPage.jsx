import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Hash, Heart, MessageCircle, Flame, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { trackEvent } from "../../utils/analytics";

const HashtagPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hoveredPost, setHoveredPost] = useState(null);

  const [activeTab, setActiveTab] = useState('top'); // 'top' or 'recent'
  const [coverMedia, setCoverMedia] = useState(null);
  const [relatedHashtags, setRelatedHashtags] = useState([]);

  const observer = useRef();

  const fetchPosts = useCallback(async (pageNum, currentTab, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/api/posts/hashtag/${tag}?tab=${currentTab}&page=${pageNum}&limit=15`);
      
      if (res.data.success) {
        const responseData = res.data.data;
        setPosts(prev => reset ? responseData.posts : [...prev, ...responseData.posts]);
        setHasMore(responseData.pagination.hasMore);
        setTotal(responseData.pagination.total);
        
        if (reset) {
          trackEvent('hashtag_visit', { tag, total: responseData.pagination.total });
          if (responseData.coverMedia !== undefined) setCoverMedia(responseData.coverMedia);
          if (responseData.relatedHashtags !== undefined) setRelatedHashtags(responseData.relatedHashtags);
        }
      }
    } catch (e) {
      console.error("Failed to fetch hashtag posts", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tag]);

  // Refetch when tag or tab changes
  useEffect(() => {
    setPage(1);
    fetchPosts(1, activeTab, true);
  }, [tag, activeTab, fetchPosts]);

  // Infinite Scroll
  const lastPostRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchPosts(next, activeTab, false);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, activeTab, fetchPosts]);

  return (
    <div className="w-full pb-20">
      
      {/* ── Hero Cover Section ── */}
      <div className="relative w-full h-[35vh] min-h-[250px] md:h-[45vh] bg-bg-surface overflow-hidden">
        {coverMedia ? (
          <>
            <img 
              src={coverMedia} 
              alt={`#${tag} cover`}
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-70"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 hero-gradient opacity-20" />
        )}

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-8 pb-8 z-10 max-w-5xl mx-auto w-full">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 md:left-8 bg-bg-base/50 hover:bg-bg-base backdrop-blur-md text-text-primary p-2.5 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full hero-gradient flex items-center justify-center border-4 border-bg-base shadow-xl flex-shrink-0">
              <Hash className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-1">
                #{tag}
              </h1>
              {!loading && (
                <p className="text-lg text-text-secondary font-medium">
                  {total.toLocaleString()} posts
                </p>
              )}
            </div>
          </div>

          {/* Related Hashtags */}
          {!loading && relatedHashtags.length > 0 && (
            <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              <span className="text-sm font-semibold text-text-secondary mr-2 flex-shrink-0">Related:</span>
              {relatedHashtags.map(rTag => (
                <Link
                  key={rTag}
                  to={`/app/hashtag/${rTag}`}
                  className="flex-shrink-0 px-4 py-1.5 bg-bg-surface/80 hover:bg-primary-500/10 backdrop-blur-md border border-border-soft hover:border-primary-500/30 rounded-full text-sm font-medium text-text-primary hover:text-primary-500 transition-all"
                >
                  #{rTag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
        
        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-6 mb-8 border-b border-border-soft">
          <button
            onClick={() => setActiveTab('top')}
            className={`pb-4 px-2 font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'top' ? 'text-primary-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Flame className="w-4 h-4" /> Top Posts
            {activeTab === 'top' && (
              <motion.div layoutId="hashtagTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-4 px-2 font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'recent' ? 'text-primary-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Clock className="w-4 h-4" /> Recent
            {activeTab === 'recent' && (
              <motion.div layoutId="hashtagTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        {/* ── Content Grid ── */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-3xl border border-border-soft max-w-lg mx-auto">
            <Hash className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No posts yet</h3>
            <p className="text-text-secondary">Be the first to use #{tag} in your caption!</p>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div style={{ columns: "2", columnGap: "16px" }} className="md:[columns:3]">
              {posts.map((post, index) => {
                const isLast = index === posts.length - 1;
                const mediaUrl = post.media?.[0]?.url;
                if (!mediaUrl) return null;
                return (
                  <motion.div
                    key={post._id}
                    ref={isLast ? lastPostRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min((index % 10) * 0.05, 0.5) }}
                    className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-bg-surface"
                    onMouseEnter={() => setHoveredPost(post._id)}
                    onMouseLeave={() => setHoveredPost(null)}
                  >
                    <Link to={`/app/profile/${post.user?._id}`}>
                      <img
                        src={mediaUrl}
                        alt={post.caption || "Post"}
                        className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <AnimatePresence>
                        {hoveredPost === post._id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                                <img src={post.user?.profilePicture || post.user?.avatar} className="w-5 h-5 rounded-full object-cover" alt="User" />
                                <span className="text-white text-xs font-semibold">{post.user?.username}</span>
                              </div>
                              <div className="flex items-center gap-3 text-white">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 fill-white" />
                                  <span className="font-bold text-xs">{post.likesCount !== undefined ? post.likesCount : post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4 fill-white" />
                                  <span className="font-bold text-xs">{post.commentsCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-12">
                <p className="text-text-secondary font-medium">You've seen all #{tag} posts! 🏷️</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HashtagPage;
