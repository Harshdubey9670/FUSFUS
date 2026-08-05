import React, { useState, useEffect, useRef, useCallback, Suspense, memo } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, X, Heart, MessageCircle, TrendingUp, Hash, Compass, Sparkles, Clock, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { Avatar } from "../../components/ui/Avatar";
import { trackEvent } from "../../utils/analytics";
import { fetchWithCache, prefetch } from "../../utils/cache";
import { LazyImage } from "../../components/ui/LazyImage";

// Lazy load the heavy carousel component
const PopularCreatorsCarousel = React.lazy(() => import("../../components/user/PopularCreatorsCarousel"));
import { Video } from "lucide-react";

// --- Memoized Components ---

const NewMediaCard = memo(({ post }) => {
  return (
    <Link
      to={`/app/profile/${post.user?._id}`}
      onClick={() => trackEvent('recommendation_click', post._id, { source: 'explore_newest' })}
      onMouseEnter={() => prefetch(`/api/users/${post.user?._id}`, () => api.get(`/api/users/${post.user?._id}`))}
      className="min-w-[120px] sm:min-w-[140px] w-[120px] sm:w-[140px] h-[160px] sm:h-[180px] rounded-2xl overflow-hidden relative group shadow-sm flex-shrink-0 bg-bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '140px 180px' }}
      aria-label={`Post by ${post.user?.username || 'user'}`}
    >
      <LazyImage
        src={post.media?.[0]?.url}
        alt="New media"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        containerClassName="w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">
        <div className="flex items-center gap-1" aria-label={`${post.likes?.length || 0} likes`}>
          <Heart className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
          <span className="text-xs font-bold">{post.likes?.length || 0}</span>
        </div>
        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/50" aria-label={`Profile of ${post.user?.username}`}>
           <Avatar src={post.user?.profilePicture || post.user?.avatar} className="w-full h-full" />
        </div>
      </div>
    </Link>
  );
});

const PostCard = memo(({ post, index, isLast, lastPostRef }) => {
  const [isHovered, setIsHovered] = useState(false);
  const mediaUrl = post.media?.[0]?.url;
  if (!mediaUrl) return null;

  return (
    <motion.div
      ref={isLast ? lastPostRef : null}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="relative mb-2 break-inside-avoid rounded-xl overflow-hidden cursor-pointer group"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 250px' }}
      onMouseEnter={() => {
        setIsHovered(true);
        prefetch(`/api/users/${post.user?._id}`, () => api.get(`/api/users/${post.user?._id}`));
      }}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => {
        setIsHovered(true);
        prefetch(`/api/users/${post.user?._id}`, () => api.get(`/api/users/${post.user?._id}`));
      }}
      onBlur={() => setIsHovered(false)}
    >
      <Link 
        to={`/app/profile/${post.user?._id}`}
        onClick={() => trackEvent('recommendation_click', post._id, { source: 'explore_grid' })}
        className="block w-full h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 rounded-xl"
        aria-label={`View post by ${post.user?.username || 'user'}`}
      >
        <LazyImage
          src={mediaUrl}
          alt={post.caption || "Post"}
          className="w-full h-auto block object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4"
            >
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2" aria-label={`${post.likes?.length || 0} likes`}>
                  <Heart className="w-5 h-5 fill-white" aria-hidden="true" />
                  <span className="font-bold text-sm">{post.likes?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2" aria-label={`${post.comments?.length || 0} comments`}>
                  <MessageCircle className="w-5 h-5 fill-white" aria-hidden="true" />
                  <span className="font-bold text-sm">{post.comments?.length || 0}</span>
                </div>
              </div>
              {/* User mini-pill */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <Avatar src={post.user?.profilePicture || post.user?.avatar} alt={post.user?.username} className="w-full h-full rounded-full" />
                </div>
                <span className="text-white text-xs font-semibold">{post.user?.username}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
});


const ExplorePage = () => {
  // --- Explore Grid State ---
  const [posts, setPosts] = useState([]);
  const [newestMedia, setNewestMedia] = useState([]);
  const [suggestedReels, setSuggestedReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [gridLoading, setGridLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- Trending Hashtags State ---
  const [trendingTags, setTrendingTags] = useState([]);

  const observer = useRef();

  // --- Explore Grid Fetch (Cached) ---
  const fetchExplorePosts = useCallback(async (pageNum, reset = false) => {
    try {
      if (pageNum === 1) setGridLoading(true);
      else setLoadingMore(true);

      const fetcher = () => api.get(`/api/posts/explore?page=${pageNum}&limit=18`);
      // Use cache for the first page only to make it instant
      const res = pageNum === 1 ? await fetchWithCache(`/explore?page=1`, fetcher) : await fetcher();

      if (res.data.success) {
        setPosts(prev => reset ? res.data.data.posts : [...prev, ...res.data.data.posts]);
        if (reset) {
          setTrendingTags(res.data.data.trendingHashtags || []);
          setNewestMedia(res.data.data.newestMedia || []);
          setSuggestedReels(res.data.data.suggestedReels || []);
        }
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (e) { console.error("Explore fetch error", e); }
    finally { setGridLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    fetchExplorePosts(1, true);
  }, [fetchExplorePosts]);

  // --- Infinite Scroll ---
  const lastPostRef = useCallback((node) => {
    if (gridLoading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchExplorePosts(next, false);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [gridLoading, loadingMore, hasMore, fetchExplorePosts]);

  return (
    <div className="w-full max-w-4xl mx-auto pt-3 sm:pt-4 pb-safe-20 lg:pb-8 px-3 sm:px-4 md:px-0">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6" aria-hidden="true">
        <div className="p-2 rounded-xl hero-gradient">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Explore</h1>
      </div>

      {/* ── Content Area ── */}
      <AnimatePresence mode="wait">
          <motion.div
            key="explore"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Popular Creators (Lazy Loaded) ── */}
            <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>}>
              <PopularCreatorsCarousel />
            </Suspense>

            {/* ── Newest Media ── */}
            {!gridLoading && newestMedia.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2" aria-hidden="true">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <h2 className="font-semibold text-text-primary" id="newest-drops-heading">Newest Drops</h2>
                  </div>
                </div>
                <div 
                  className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1"
                  role="region"
                  aria-labelledby="newest-drops-heading"
                >
                  {newestMedia.map((post) => (
                    <NewMediaCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Suggested Reels ── */}
            {!gridLoading && suggestedReels.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 border-t border-border-soft pt-6">
                  <div className="flex items-center gap-2" aria-hidden="true">
                    <Video className="w-5 h-5 text-primary-500" />
                    <h2 className="font-semibold text-text-primary" id="suggested-reels-heading">Suggested Reels</h2>
                  </div>
                </div>
                <div 
                  className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1"
                  role="region"
                  aria-labelledby="suggested-reels-heading"
                >
                  {suggestedReels.map((post) => (
                    <NewMediaCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4 border-t border-border-soft pt-6" aria-hidden="true">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-text-primary" id="trending-hashtags-heading">Trending</h2>
              </div>
            </div>

            {/* Trending Hashtags Pills */}
            {trendingTags.length > 0 && (
              <div 
                className="mb-5"
                role="region"
                aria-labelledby="trending-hashtags-heading"
              >
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {trendingTags.map((item, i) => (
                    <Link
                      key={item.tag}
                      to={`/app/hashtag/${item.tag}`}
                      aria-label={`Hashtag ${item.tag} with ${item.count} posts`}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface border border-border-soft rounded-full text-sm font-medium text-text-secondary hover:text-primary-500 hover:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
                    >
                      <Hash className="w-3.5 h-3.5" aria-hidden="true" />
                      {item.tag}
                      <span className="text-xs text-text-secondary font-semibold">· {item.count}</span>
                    </Link>
                  ))}
                  <Link
                    to="/app/trending-hashtags"
                    aria-label="See all trending hashtags"
                    className="flex-shrink-0 px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm font-semibold text-primary-500 hover:bg-primary-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
                  >
                    See All →
                  </Link>
                </div>
              </div>
            )}

            {gridLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24 bg-bg-surface rounded-2xl border border-border-soft">
                <Compass className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="font-semibold text-text-primary">Nothing to explore yet</p>
                <p className="text-sm text-text-secondary mt-1">Be the first to post something!</p>
              </div>
            ) : (
              <>
                {/* CSS Masonry Grid */}
                <div
                  role="feed"
                  aria-busy={loadingMore}
                  aria-label="Explore posts"
                  className="columns-2 sm:columns-3 lg:columns-4 gap-2 sm:gap-3 md:gap-4 space-y-2 sm:space-y-3 md:space-y-4"
                >
                  {posts.map((post, index) => {
                    const isLast = index === posts.length - 1;
                    return (
                      <PostCard 
                        key={post._id} 
                        post={post} 
                        index={index} 
                        isLast={isLast} 
                        lastPostRef={lastPostRef} 
                      />
                    );
                  })}
                </div>

                {/* Load More Spinner */}
                {loadingMore && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-text-secondary text-sm py-8">You've seen it all! 🎉</p>
                )}
              </>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ExplorePage;
