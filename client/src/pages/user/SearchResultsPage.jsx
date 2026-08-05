import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, Loader2, Filter, X, Heart, MessageCircle, BadgeCheck, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { Avatar } from "../../components/ui/Avatar";
import { ErrorState } from "../../components/ui/ErrorState";

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';

  const [activeTab, setActiveTab] = useState(initialType);
  const [results, setResults] = useState({ users: [], posts: [], stories: [], hashtags: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState({ users: false, posts: false, stories: false });
  const [hoveredPost, setHoveredPost] = useState(null);
  const [error, setError] = useState(null);
  
  // Filter Drawer State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    date: searchParams.get('date') || 'all',
    mediaType: searchParams.get('mediaType') || 'all',
    verified: searchParams.get('verified') === 'true',
    sort: searchParams.get('sort') || 'recent',
  });

  const observer = useRef();

  const fetchResults = useCallback(async (pageNum, reset = false, currentFilters = filters, tab = activeTab) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        q: query,
        type: tab,
        page: pageNum,
        limit: 15,
        ...currentFilters
      });

      const res = await api.get(`/api/search/advanced?${params.toString()}`);
      
      if (res.data.success) {
        const { users, posts, stories, hashtags, pagination } = res.data.data;
        
        setResults(prev => reset ? { users, posts, stories, hashtags } : {
          users: [...prev.users, ...users],
          posts: [...prev.posts, ...posts],
          stories: [...prev.stories, ...stories],
          hashtags: [...prev.hashtags, ...hashtags]
        });
        
        setHasMore({
          users: pagination.userHasMore,
          posts: pagination.postHasMore,
          stories: pagination.storyHasMore
        });
        setError(null);
      } else {
        setError(res.data.message || "Failed to load search results.");
      }
    } catch (e) {
      console.error("Search failed", e);
      setError("An error occurred while fetching search results. Please check your connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, activeTab, filters]);

  // Initial fetch and on query/filter changes
  useEffect(() => {
    setPage(1);
    fetchResults(1, true);
    // Update URL to match state
    const params = new URLSearchParams(searchParams);
    params.set('type', activeTab);
    setSearchParams(params, { replace: true });
  }, [query, activeTab, filters, fetchResults]); // Note: omitting searchParams/setSearchParams to avoid loops

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    // Sync to URL
    const params = new URLSearchParams({ q: query, type: activeTab });
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.date !== 'all') params.set('date', newFilters.date);
    if (newFilters.mediaType !== 'all') params.set('mediaType', newFilters.mediaType);
    if (newFilters.verified) params.set('verified', 'true');
    if (newFilters.sort !== 'recent') params.set('sort', newFilters.sort);
    setSearchParams(params);
    if (window.innerWidth < 768) setIsFilterOpen(false); // Close drawer on mobile
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Infinite Scroll logic based on active tab
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const canLoadMore = activeTab === 'users' ? hasMore.users 
                          : activeTab === 'stories' ? hasMore.stories
                          : activeTab === 'hashtags' ? false
                          : ['posts', 'reels', 'locations', 'audio'].includes(activeTab) ? hasMore.posts 
                          : (hasMore.users || hasMore.posts || hasMore.stories);
        
        if (canLoadMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchResults(next, false);
            return next;
          });
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, activeTab, fetchResults]);

  const FilterDrawer = () => {
    const [localFilters, setLocalFilters] = useState(filters);

    return (
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filters
          </h2>
          <button onClick={() => setIsFilterOpen(false)} className="md:hidden p-2 bg-bg-surface-hover rounded-full">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-3">Sort By</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setLocalFilters({...localFilters, sort: 'recent'})}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${localFilters.sort === 'recent' ? 'bg-primary-500 text-white border-primary-500' : 'bg-bg-surface border-border-soft text-text-primary hover:bg-bg-surface-hover'}`}
              >
                Recent
              </button>
              <button 
                onClick={() => setLocalFilters({...localFilters, sort: 'popular'})}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${localFilters.sort === 'popular' ? 'bg-primary-500 text-white border-primary-500' : 'bg-bg-surface border-border-soft text-text-primary hover:bg-bg-surface-hover'}`}
              >
                Popular
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-3">Location</label>
            <input 
              type="text"
              placeholder="e.g. New York"
              value={localFilters.location}
              onChange={(e) => setLocalFilters({...localFilters, location: e.target.value})}
              className="w-full bg-bg-surface border border-border-soft rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-3">Date Posted</label>
            <select 
              value={localFilters.date}
              onChange={(e) => setLocalFilters({...localFilters, date: e.target.value})}
              className="w-full bg-bg-surface border border-border-soft rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary-500 transition-colors appearance-none"
            >
              <option value="all">Any time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-3">Media Type</label>
            <div className="flex gap-2">
              {['all', 'image', 'video'].map(type => (
                <button 
                  key={type}
                  onClick={() => setLocalFilters({...localFilters, mediaType: type})}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border capitalize ${localFilters.mediaType === type ? 'bg-bg-surface-hover border-primary-500 text-primary-500' : 'bg-bg-surface border-border-soft text-text-primary hover:bg-bg-surface-hover'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-sm font-semibold text-text-primary">Verified Only</label>
              <span className="text-xs text-text-secondary">Show only verified users & posts</span>
            </div>
            <button 
              onClick={() => setLocalFilters({...localFilters, verified: !localFilters.verified})}
              className={`w-12 h-6 rounded-full transition-colors relative ${localFilters.verified ? 'bg-primary-500' : 'bg-bg-surface-hover'}`}
            >
              <motion.div 
                animate={{ x: localFilters.verified ? 24 : 2 }}
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border-soft flex gap-3">
          <button 
            onClick={() => {
              const reset = { location: '', date: 'all', mediaType: 'all', verified: false, sort: 'recent' };
              setLocalFilters(reset);
              handleApplyFilters(reset);
            }}
            className="flex-1 py-3 text-text-secondary font-semibold hover:bg-bg-surface-hover rounded-xl transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={() => handleApplyFilters(localFilters)}
            className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen pt-4 pb-20 px-4 md:px-0">
      
      {/* ── Search Header ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl hero-gradient shadow-lg">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Results for "{query}"</h1>
            <p className="text-sm text-text-secondary">Explore matches across the platform</p>
          </div>
        </div>
        
        {/* Mobile Filter Trigger */}
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="md:hidden flex items-center justify-center gap-2 py-2.5 bg-bg-surface border border-border-soft rounded-xl text-text-primary font-semibold shadow-sm"
        >
          <Filter className="w-4 h-4" /> Filter Results
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start relative">
        
        {/* ── Desktop Sticky Filter Drawer ── */}
        <div className="hidden md:block w-[300px] shrink-0 sticky top-24 h-[calc(100vh-120px)] glass-card rounded-3xl border border-border-soft overflow-hidden">
          <FilterDrawer />
        </div>

        {/* ── Mobile Filter Drawer (BottomSheet) ── */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed bottom-0 left-0 right-0 h-[80vh] bg-bg-base z-50 rounded-t-3xl border-t border-border-soft shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-border-soft rounded-full mx-auto mt-3 mb-1" />
                <FilterDrawer />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Results Area ── */}
        <div className="flex-1 w-full min-w-0">
          
          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-border-soft overflow-x-auto hide-scrollbar whitespace-nowrap">
            {['all', 'users', 'posts', 'reels', 'hashtags', 'locations', 'audio', 'stories'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`pb-4 px-2 font-semibold transition-colors relative capitalize ${activeTab === tab ? 'text-primary-500' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="searchTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="py-12">
              <ErrorState 
                title="Search Failed" 
                message={error} 
                onRetry={() => fetchResults(page, true)} 
              />
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* Users Section */}
              {(activeTab === 'all' || activeTab === 'users') && (
                <div>
                  {activeTab === 'all' && results.users.length > 0 && <h3 className="font-bold text-lg mb-4 text-text-primary">Accounts</h3>}
                  {results.users.length === 0 ? (
                    activeTab === 'users' && (
                      <div className="text-center py-16 bg-bg-surface rounded-2xl">
                        <p className="text-text-secondary font-medium">No users found for "{query}"</p>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.users.map((user, idx) => (
                        <Link 
                          key={user._id} 
                          to={`/app/profile/${user._id}`}
                          ref={(activeTab === 'users' && idx === results.users.length -1) ? lastElementRef : null}
                          className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-bg-surface-hover transition-colors"
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-bg-base shadow-sm">
                            <Avatar src={user.profilePicture || user.avatar} className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-text-primary truncate flex items-center gap-1">
                              {user.fullName || user.username}
                              {user.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                            </h4>
                            <p className="text-sm text-text-secondary truncate">@{user.username}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hashtags Section */}
              {(activeTab === 'all' || activeTab === 'hashtags') && (
                <div>
                  {activeTab === 'all' && results.hashtags.length > 0 && <h3 className="font-bold text-lg mb-4 text-text-primary mt-8">Hashtags</h3>}
                  {results.hashtags.length === 0 ? (
                    activeTab === 'hashtags' && (
                      <div className="text-center py-16 bg-bg-surface rounded-2xl">
                        <p className="text-text-secondary font-medium">No hashtags found for "{query}"</p>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.hashtags.map((hash, idx) => (
                        <Link 
                          key={hash.tag || idx} 
                          to={`/app/hashtag/${hash.tag}`}
                          className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-bg-surface-hover transition-colors"
                        >
                          <div className="w-14 h-14 rounded-full bg-bg-surface border border-border-soft flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-primary-500">#</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-text-primary truncate">#{hash.tag}</h4>
                            <p className="text-sm text-text-secondary truncate">{hash.count} posts</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stories Section */}
              {(activeTab === 'all' || activeTab === 'stories') && (
                <div>
                  {activeTab === 'all' && results.stories.length > 0 && <h3 className="font-bold text-lg mb-4 text-text-primary mt-8">Stories</h3>}
                  {results.stories.length === 0 ? (
                    activeTab === 'stories' && (
                      <div className="text-center py-16 bg-bg-surface rounded-2xl">
                        <p className="text-text-secondary font-medium">No active stories found for "{query}"</p>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {results.stories.map((story, idx) => {
                        const isLast = idx === results.stories.length - 1;
                        return (
                          <Link 
                            key={story._id} 
                            to={`/app/stories`}
                            ref={(activeTab === 'stories' && isLast) ? lastElementRef : null}
                            className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer"
                          >
                            <img src={story.media[0].url} alt="Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                              <div className="w-10 h-10 rounded-full border-2 border-primary-500 overflow-hidden mb-2">
                                <Avatar src={story.user?.profilePicture || story.user?.avatar} />
                              </div>
                              <span className="text-white text-xs font-bold truncate">{story.user?.username}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'all' && results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0 && results.stories.length === 0 && (
                <div className="text-center py-32">
                  <p className="text-text-secondary font-medium text-lg">No results found for "{query}"</p>
                  <p className="text-sm text-text-secondary mt-2">Try adjusting your filters or searching for something else.</p>
                </div>
              )}

              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
