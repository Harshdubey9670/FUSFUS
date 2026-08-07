import React, { useState, useEffect, useRef, useCallback, Suspense, memo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, X, Heart, MessageCircle, TrendingUp, Hash, Compass, Clock, Users, Video } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import api from "../../services/api";
import { Avatar } from "../../components/ui/Avatar";
import { trackEvent } from "../../utils/analytics";
import { fetchWithCache, prefetch } from "../../utils/cache";
import { LazyImage } from "../../components/ui/LazyImage";
import { cn } from "../../utils/cn";

// Lazy load the heavy carousel component
const PopularCreatorsCarousel = React.lazy(() => import("../../components/user/PopularCreatorsCarousel"));

// --- Memoized Components for Explore Grid ---
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const observer = useRef();
  const inputRef = useRef(null);

  // --- Search State ---
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearchActive, setIsSearchActive] = useState(initialQuery.length > 0);
  const [searchTab, setSearchTab] = useState('all'); // all, users, posts, reels, hashtags
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], stories: [], hashtags: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState({ popularUsers: [], trendingTags: [] });
  const [recentSearches, setRecentSearches] = useState([]);

  // --- Explore Grid State ---
  const [posts, setPosts] = useState([]);
  const [newestMedia, setNewestMedia] = useState([]);
  const [suggestedReels, setSuggestedReels] = useState([]);
  const [explorePageNum, setExplorePageNum] = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(true);

  // --- Smart Scroll Header ---
  const { scrollY } = useScroll();
  const [headerHidden, setHeaderHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 100) {
      setHeaderHidden(true);
    } else {
      setHeaderHidden(false);
    }
  });

  // Focus effect when switching to search mode
  useEffect(() => {
    if (isSearchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchActive]);

  // Load Search History and Suggestions once
  useEffect(() => {
    api.get('/api/search/suggestions').then(res => {
      if (res.data.success) setSearchSuggestions(res.data.data);
    }).catch(console.error);

    api.get('/api/search/history').then(res => {
      if (res.data.success) setRecentSearches(res.data.data);
    }).catch(console.error);
  }, []);

  // --- Explore Grid Fetch ---
  const fetchExplorePosts = useCallback(async (pageNum, reset = false) => {
    try {
      if (pageNum === 1) setExploreLoading(true);
      const res = await api.get(`/api/posts/explore?page=${pageNum}&limit=18`);
      if (res.data.success) {
        setPosts(prev => reset ? res.data.data.posts : [...prev, ...res.data.data.posts]);
        if (reset) {
          setNewestMedia(res.data.data.newestMedia || []);
          setSuggestedReels(res.data.data.suggestedReels || []);
        }
        setExploreHasMore(res.data.pagination.hasMore);
      }
    } catch (e) { console.error("Explore fetch error", e); }
    finally { setExploreLoading(false); }
  }, []);

  useEffect(() => {
    if (!isSearchActive) {
      fetchExplorePosts(1, true);
    }
  }, [isSearchActive, fetchExplorePosts]);

  const exploreLastPostRef = useCallback((node) => {
    if (exploreLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && exploreHasMore) {
        setExplorePageNum(prev => {
          const next = prev + 1;
          fetchExplorePosts(next, false);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [exploreLoading, exploreHasMore, fetchExplorePosts]);


  // --- Search Logic ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isSearchActive) return;
    if (debouncedQuery.trim().length === 0) {
      setSearchResults({ users: [], posts: [], stories: [], hashtags: [] });
      setSearchParams({});
      return;
    }
    
    setSearchLoading(true);
    const params = new URLSearchParams({ q: debouncedQuery, type: searchTab, limit: 15 });
    setSearchParams(params);

    api.get(`/api/search/advanced?${params.toString()}`)
      .then(res => {
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery, searchTab, isSearchActive, setSearchParams]);

  const handleSelectSuggestion = async (type, data) => {
    // Save to history
    try {
      let payload = { type };
      if (type === 'user') { payload.query = data.username; payload.refId = data._id; payload.username = data.username; payload.fullName = data.fullName; payload.avatar = data.profilePicture; }
      else if (type === 'hashtag') { payload.query = data.tag; payload.tag = data.tag; }
      else { payload.query = data; payload.type = 'text'; }
      
      const res = await api.post('/api/search/history', payload);
      if (res.data.success) setRecentSearches(res.data.data);
    } catch(err) { console.error(err); }

    if (type === 'user') navigate(`/app/profile/${data._id}`);
    else if (type === 'hashtag') navigate(`/app/hashtag/${data.tag}`);
    else setQuery(data);
  };

  const removeRecent = async (e, id) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(r => r._id !== id));
    try { await api.delete(`/api/search/history/${id}`); } catch(err) { console.error(err); }
  };


  return (
    <div className="w-full max-w-[1400px] mx-auto pt-4 pb-safe-20 lg:pb-8 px-4 md:px-8">
      
      {/* ── Fixed Search Bar Header ── */}
      <motion.div 
        variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: "-100%", opacity: 0 } }}
        animate={headerHidden ? "hidden" : "visible"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-xl pb-4 pt-2"
      >
        <div className="relative max-w-2xl mx-auto flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsSearchActive(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, posts, reels, hashtags..."
            className="w-full bg-bg-surface border border-border-soft rounded-full h-12 pl-12 pr-12 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all text-sm md:text-base"
          />
          {(query || isSearchActive) && (
            <button 
              onClick={() => { setQuery(''); setIsSearchActive(false); setSearchParams({}); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary bg-bg-surface-hover p-1 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Chips - Only visible when typing */}
        <AnimatePresence>
          {isSearchActive && query.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar pt-4 max-w-2xl mx-auto"
            >
              {['all', 'users', 'posts', 'reels', 'hashtags'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSearchTab(tab)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-colors border",
                    searchTab === tab 
                      ? "bg-primary-500 text-white border-primary-500 shadow-md" 
                      : "bg-bg-surface border-border-soft text-text-secondary hover:text-text-primary hover:border-text-secondary"
                  )}
                >
                  {tab}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="max-w-2xl mx-auto mt-4">
        {/* ── Search UI Mode ── */}
        {isSearchActive ? (
          <div className="animate-fade-in pb-12">
            {/* Empty Query: Show Suggestions & History */}
            {debouncedQuery.trim().length === 0 ? (
              <div className="space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Recent Searches</h3>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 5).map(r => (
                        <div key={r._id} onClick={() => handleSelectSuggestion(r.type, r)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-bg-surface-hover cursor-pointer group transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center shrink-0 border border-border-soft text-text-secondary">
                              {r.type === 'hashtag' ? <Hash className="w-5 h-5"/> : (r.type === 'user' && r.avatar) ? <Avatar src={r.avatar} className="w-full h-full rounded-full" /> : <Clock className="w-5 h-5"/>}
                            </div>
                            <span className="font-semibold text-text-primary text-sm">{r.query}</span>
                          </div>
                          <button onClick={(e) => removeRecent(e, r._id)} className="p-2 text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchSuggestions.popularUsers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Suggested Users</h3>
                    <div className="space-y-1">
                      {searchSuggestions.popularUsers.map(u => (
                        <div key={u._id} onClick={() => handleSelectSuggestion('user', u)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-surface-hover cursor-pointer transition-colors">
                          <Avatar src={u.profilePicture || u.avatar} className="w-10 h-10 rounded-full border border-border-soft" />
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary text-sm">{u.username}</span>
                            <span className="text-xs text-text-secondary">{u.fullName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchSuggestions.trendingTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Trending Hashtags</h3>
                    <div className="flex flex-wrap gap-2 px-2">
                      {searchSuggestions.trendingTags.map(tag => (
                        <div key={tag.tag} onClick={() => handleSelectSuggestion('hashtag', tag)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface border border-border-soft text-sm font-semibold hover:border-primary-500 hover:text-primary-500 cursor-pointer transition-colors">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>#{tag.tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Active Query Results */
              <div className="space-y-4">
                {searchLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : (
                  <>
                    {(searchTab === 'all' || searchTab === 'users') && searchResults.users?.length > 0 && (
                      <div className="mb-6">
                        {searchTab === 'all' && <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Users</h3>}
                        <div className="space-y-1">
                          {searchResults.users.map(u => (
                            <Link to={`/app/profile/${u._id}`} key={u._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-surface-hover transition-colors">
                              <Avatar src={u.profilePicture || u.avatar} className="w-12 h-12 rounded-full border border-border-soft" />
                              <div className="flex flex-col">
                                <span className="font-bold text-text-primary">{u.username}</span>
                                <span className="text-xs text-text-secondary">{u.fullName}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(searchTab === 'all' || searchTab === 'hashtags') && searchResults.hashtags?.length > 0 && (
                      <div className="mb-6">
                        {searchTab === 'all' && <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Hashtags</h3>}
                        <div className="space-y-1">
                          {searchResults.hashtags.map(h => (
                            <Link to={`/app/hashtag/${h.tag}`} key={h._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-surface-hover transition-colors">
                              <div className="w-12 h-12 rounded-full bg-bg-surface border border-border-soft flex items-center justify-center">
                                <Hash className="w-6 h-6 text-text-secondary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-text-primary">#{h.tag}</span>
                                <span className="text-xs text-text-secondary">{h.postCount} posts</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posts and Reels are omitted for brevity in search results, in a real app you'd map the PostCard grid here */}
                    {Object.values(searchResults).every(arr => arr.length === 0) && (
                       <div className="text-center py-20 text-text-secondary flex flex-col items-center">
                         <Search className="w-12 h-12 mb-4 opacity-50" />
                         <p>No results found for "{query}"</p>
                       </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Explore UI Mode ── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-fade-in">
            {/* Popular Creators */}
            <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>}>
              <PopularCreatorsCarousel />
            </Suspense>

            {/* Newest Drops */}
            {!exploreLoading && newestMedia.length > 0 && (
              <div className="mb-8 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <h2 className="font-semibold text-text-primary text-lg">Newest Drops</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
                  {newestMedia.map((post) => <NewMediaCard key={post._id} post={post} />)}
                </div>
              </div>
            )}

            {/* Suggested Reels */}
            {!exploreLoading && suggestedReels.length > 0 && (
              <div className="mb-8 border-t border-border-soft pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-5 h-5 text-primary-500" />
                  <h2 className="font-semibold text-text-primary text-lg">Suggested Reels</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
                  {suggestedReels.map((post) => <NewMediaCard key={post._id} post={post} />)}
                </div>
              </div>
            )}

            {/* Main Explore Grid (Masonry style using columns) */}
            <div className="border-t border-border-soft pt-6 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-text-primary text-lg">Discover</h2>
              </div>
            </div>
            
            <div className="columns-2 md:columns-3 gap-2 space-y-2 pb-12">
              {posts.map((post, index) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  index={index} 
                  isLast={index === posts.length - 1} 
                  lastPostRef={exploreLastPostRef} 
                />
              ))}
            </div>
            {exploreLoading && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
