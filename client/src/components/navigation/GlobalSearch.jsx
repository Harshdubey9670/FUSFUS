import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Loader2, X, Hash, Clock, TrendingUp, Users, Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../utils/cn";
import { trackEvent } from "../../utils/analytics";

export const GlobalSearch = ({ isMobile = false, onClose }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  // Data states
  const [results, setResults] = useState({ users: [], hashtags: [] });
  const [suggestions, setSuggestions] = useState({ popularUsers: [], trendingTags: [] });
  const [recent, setRecent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const showPanel = isMobile || isFocused || query.length > 0;

  // Combine lists for keyboard navigation
  const getFlatList = () => {
    if (query.trim().length > 0) {
      return [
        ...results.users.map(u => ({ ...u, _type: 'user' })),
        ...results.hashtags.map(h => ({ ...h, _type: 'hashtag' }))
      ];
    } else {
      return [
        ...recent.map(r => ({ ...r, _type: 'recent' })),
        ...suggestions.popularUsers.map(u => ({ ...u, _type: 'user', _suggestion: true })),
        ...suggestions.trendingTags.map(h => ({ ...h, _type: 'hashtag', _suggestion: true }))
      ];
    }
  };

  const flatList = getFlatList();

  // Focus input on mount if mobile
  useEffect(() => {
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  // Click outside listener for desktop
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isMobile && containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Fetch initial suggestions and recent history
  useEffect(() => {
    if (showPanel) {
      if (!query && suggestions.popularUsers.length === 0) {
        api.get('/api/search/suggestions')
          .then(res => {
            if (res.data.success) setSuggestions(res.data.data);
          })
          .catch(console.error);
      }
      
      // Fetch backend search history
      api.get('/api/search/history')
        .then(res => {
          if (res.data.success) setRecent(res.data.data);
        })
        .catch(console.error);
    }
  }, [showPanel, query, suggestions.popularUsers.length]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      setIsLoading(true);
      setError(null);
      api.get(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => {
          if (res.data.success) {
            setResults(res.data.data);
            setSelectedIndex(-1); // Reset selection
          }
        })
        .catch(err => {
          console.error(err);
          setError("Failed to fetch results. Check your connection.");
        })
        .finally(() => setIsLoading(false));
    } else {
      setResults({ users: [], hashtags: [] });
      setError(null);
      setSelectedIndex(-1);
    }
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showPanel || flatList.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatList.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatList.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatList.length) {
        handleSelect(flatList[selectedIndex]);
      } else if (query.trim().length > 0) {
        // Log query search to history
        api.post('/api/search/history', { query: query.trim(), type: 'text' }).then(res => {
          if (res.data.success) setRecent(res.data.data);
        });
        
        // Track analytics
        trackEvent('search', null, { query: query.trim() });
        
        setIsFocused(false);
        if (isMobile && onClose) onClose();
        navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsFocused(false);
      if (isMobile && onClose) onClose();
    }
  };

  const saveRecent = async (item) => {
    let payload = {};
    if (item._type === 'user' || item.username) {
      payload = {
        query: item.username,
        type: 'user',
        refId: item._id,
        username: item.username,
        fullName: item.fullName,
        avatar: item.profilePicture || item.avatar
      };
    } else if (item._type === 'hashtag' || item.tag) {
      payload = {
        query: item.tag,
        type: 'hashtag',
        tag: item.tag
      };
    } else {
      payload = { query: item.query, type: 'text' };
    }

    try {
      const res = await api.post('/api/search/history', payload);
      if (res.data.success) setRecent(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeRecent = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistic update
    setRecent(prev => prev.filter(r => r._id !== id));
    try {
      await api.delete(`/api/search/history/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistic update
    setRecent(prev => {
      const updated = [...prev];
      const index = updated.findIndex(r => r._id === id);
      if (index > -1) {
        updated[index].isPinned = !updated[index].isPinned;
      }
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    });
    
    try {
      await api.put(`/api/search/history/${id}/pin`);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllHistory = async () => {
    setRecent(prev => prev.filter(r => r.isPinned));
    try {
      await api.delete('/api/search/history');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (item) => {
    saveRecent(item);
    setQuery("");
    setIsFocused(false);
    if (isMobile && onClose) onClose();
    
    // Track analytics if it was a suggestion click
    if (item._suggestion) {
      trackEvent('trending_click', item._id || item.tag, { type: item._type });
    }
    
    if (item._type === 'user' || item.type === 'user' || item.username) {
      const id = item.refId || item._id; // Handle backend history refId vs initial search _id
      navigate(`/app/profile/${id}`);
    } else if (item._type === 'hashtag' || item.type === 'hashtag' || item.tag) {
      navigate(`/app/hashtag/${item.tag || item.query}`);
    } else if (item.type === 'text') {
      navigate(`/app/search?q=${encodeURIComponent(item.query)}`);
    }
  };

  // Render helpers
  const renderUser = (user, index, isRecent = false, isSuggestion = false) => {
    const isSelected = selectedIndex === index;
    return (
      <div
        key={user._id || index}
        onClick={() => handleSelect({ ...user, _type: 'user' })}
        className={cn(
          "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
          isSelected ? "bg-bg-surface-hover" : "hover:bg-bg-surface-hover",
          isRecent && user.isPinned ? "bg-primary-50/5" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border-soft">
            <Avatar src={user.profilePicture || user.avatar} alt={user.username || user.query} className="w-full h-full rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-text-primary">{user.username || user.query}</span>
            <span className="text-xs text-text-secondary">{user.fullName || (isSuggestion && 'Popular') || 'User'}</span>
          </div>
        </div>
        {isRecent && (
          <div className="flex items-center gap-1">
            <button onClick={(e) => togglePin(e, user._id)} className={cn("p-2 hover:text-text-primary", user.isPinned ? "text-primary-500" : "text-text-secondary")}>
              <Pin className={cn("w-4 h-4", user.isPinned && "fill-current")} />
            </button>
            <button onClick={(e) => removeRecent(e, user._id)} className="p-2 text-text-secondary hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHashtag = (hash, index, isRecent = false, isSuggestion = false) => {
    const isSelected = selectedIndex === index;
    return (
      <div
        key={hash.tag || hash._id || index}
        onClick={() => handleSelect({ ...hash, _type: 'hashtag' })}
        className={cn(
          "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
          isSelected ? "bg-bg-surface-hover" : "hover:bg-bg-surface-hover",
          isRecent && hash.isPinned ? "bg-primary-50/5" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-surface border border-border-soft flex items-center justify-center flex-shrink-0">
            <Hash className="w-5 h-5 text-text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-text-primary">#{hash.tag || hash.query}</span>
            <span className="text-xs text-text-secondary">{hash.count ? `${hash.count} posts` : 'Hashtag'}</span>
          </div>
        </div>
        {isRecent && (
          <div className="flex items-center gap-1">
            <button onClick={(e) => togglePin(e, hash._id)} className={cn("p-2 hover:text-text-primary", hash.isPinned ? "text-primary-500" : "text-text-secondary")}>
              <Pin className={cn("w-4 h-4", hash.isPinned && "fill-current")} />
            </button>
            <button onClick={(e) => removeRecent(e, hash._id)} className="p-2 text-text-secondary hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };
  
  const renderText = (item, index, isRecent = false) => {
    const isSelected = selectedIndex === index;
    return (
      <div
        key={item._id || index}
        onClick={() => handleSelect(item)}
        className={cn(
          "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
          isSelected ? "bg-bg-surface-hover" : "hover:bg-bg-surface-hover",
          isRecent && item.isPinned ? "bg-primary-50/5" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-surface border border-border-soft flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-text-primary">{item.query}</span>
            <span className="text-xs text-text-secondary">Search</span>
          </div>
        </div>
        {isRecent && (
          <div className="flex items-center gap-1">
            <button onClick={(e) => togglePin(e, item._id)} className={cn("p-2 hover:text-text-primary", item.isPinned ? "text-primary-500" : "text-text-secondary")}>
              <Pin className={cn("w-4 h-4", item.isPinned && "fill-current")} />
            </button>
            <button onClick={(e) => removeRecent(e, item._id)} className="p-2 text-text-secondary hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  let currentIndexOffset = 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", isMobile ? "h-full flex flex-col" : "max-w-md")}>
      
      {/* Search Input Area */}
      <div className={cn("relative w-full z-[60]", isMobile && "p-4 border-b border-border-soft")}>
        <Search className="absolute left-7 md:left-3 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-text-secondary" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people or hashtags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-bg-surface border border-border-soft text-text-primary placeholder:text-text-secondary focus:outline-none transition-all",
            isMobile 
              ? "rounded-2xl h-12 pl-12 pr-10 text-base" 
              : "rounded-full h-10 pl-10 pr-10 text-sm focus:bg-bg-base focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          )}
        />
        
        {/* Loading Spinner or Clear Button inside input */}
        {isLoading ? (
          <Loader2 className="absolute right-7 md:right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary-500" />
        ) : query ? (
          <button 
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-7 md:right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Suggestions / Results Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              isMobile 
                ? "flex-1 overflow-y-auto bg-bg-base" 
                : "absolute top-full left-0 right-0 mt-2 bg-bg-base border border-border-soft rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] flex flex-col"
            )}
          >
            <div className={cn("flex-1 overflow-y-auto", isMobile ? "" : "py-2")}>
              
              {/* STATE: Active Query Results */}
              {query.trim().length > 0 ? (
                <>
                  {error ? (
                    <div className="py-12 text-center px-4">
                      <p className="text-sm font-medium text-red-500 mb-2">{error}</p>
                      <button 
                        onClick={() => {
                          setDebouncedQuery("");
                          setTimeout(() => setDebouncedQuery(query), 50);
                        }}
                        className="text-xs font-semibold text-primary-500 hover:text-primary-600"
                      >
                        Tap to retry
                      </button>
                    </div>
                  ) : results.users.length === 0 && results.hashtags.length === 0 && !isLoading ? (
                    <div className="py-12 text-center">
                      <Search className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium text-text-primary">No results found for "{query}"</p>
                    </div>
                  ) : (
                    <>
                      {results.users.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">Users</div>
                          {results.users.map((u) => {
                            const node = renderUser(u, currentIndexOffset);
                            currentIndexOffset++;
                            return node;
                          })}
                        </div>
                      )}
                      
                      {results.hashtags.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">Hashtags</div>
                          {results.hashtags.map((h) => {
                            const node = renderHashtag(h, currentIndexOffset);
                            currentIndexOffset++;
                            return node;
                          })}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* STATE: Empty Query (Recent & Trending) */
                <>
                  {recent.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Recent</span>
                        <button onClick={clearAllHistory} className="text-xs font-semibold text-primary-500 hover:text-primary-600">Clear all</button>
                      </div>
                      {recent.map((r, i) => {
                        let node;
                        if (r.type === 'user') node = renderUser(r, currentIndexOffset, true);
                        else if (r.type === 'hashtag') node = renderHashtag(r, currentIndexOffset, true);
                        else node = renderText(r, currentIndexOffset, true);
                        currentIndexOffset++;
                        return node;
                      })}
                    </div>
                  )}

                  {suggestions.popularUsers.length > 0 && (
                    <div className="mb-4">
                      <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5"/> Popular Creators
                      </div>
                      {suggestions.popularUsers.map((u) => {
                        const node = renderUser(u, currentIndexOffset, false, true);
                        currentIndexOffset++;
                        return node;
                      })}
                    </div>
                  )}

                  {suggestions.trendingTags.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5"/> Trending Searches
                      </div>
                      {suggestions.trendingTags.map((h) => {
                        const node = renderHashtag(h, currentIndexOffset, false, true);
                        currentIndexOffset++;
                        return node;
                      })}
                    </div>
                  )}
                </>
              )}
              {query.trim().length > 0 && (
                <div 
                  onClick={() => {
                    // Log query search to history
                    api.post('/api/search/history', { query: query.trim(), type: 'text' }).then(res => {
                      if (res.data.success) setRecent(res.data.data);
                    });
                    
                    // Track analytics
                    trackEvent('search', null, { query: query.trim() });
                    
                    setIsFocused(false);
                    if (isMobile && onClose) onClose();
                    navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
                  }}
                  className="p-3 mt-2 border-t border-border-soft text-center text-sm font-semibold text-primary-500 cursor-pointer hover:bg-bg-surface-hover transition-colors"
                >
                  See all results for "{query}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
