import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2, Search, ArrowLeft, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { FollowButton } from '../../components/profile/FollowButton';

const FollowingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const observer = useRef();

  const isOwner = authUser?._id === id;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Following
  const fetchFollowing = useCallback(async (pageNum, searchQuery, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/api/users/${id}/following`, {
        params: { page: pageNum, limit: 15, search: searchQuery }
      });

      if (res.data.success) {
        setFollowing(prev => reset ? res.data.data : [...prev, ...res.data.data]);
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load following list' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, toast]);

  // Effect for initial load and search change
  useEffect(() => {
    setPage(1);
    fetchFollowing(1, debouncedSearch, true);
  }, [debouncedSearch, fetchFollowing]);

  // Infinite Scroll Observer
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchFollowing(next, debouncedSearch, false);
          return next;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchFollowing, debouncedSearch]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 pt-4 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 glass-card p-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Following</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input 
          type="text"
          placeholder="Search following..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 bg-bg-surface border border-border-soft rounded-2xl pl-12 pr-10 text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Following List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface rounded-2xl border border-border-soft">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-surface-hover mb-4">
              <Users className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No users found</h3>
            <p className="text-text-secondary">
              {debouncedSearch ? 'Try a different search term.' : 'This account is not following anyone yet.'}
            </p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-border-soft border-none rounded-2xl overflow-hidden">
            {following.map((user, index) => {
              const isLast = index === following.length - 1;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  key={user._id}
                  ref={isLast ? lastElementRef : null}
                  className="flex items-center justify-between p-4 hover:bg-bg-surface-hover transition-colors"
                >
                  <Link to={`/app/profile/${user._id}`} className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full hero-gradient p-[2px]">
                      <Avatar src={user.profilePicture || user.avatar} alt={user.username} className="w-full h-full border-2 border-bg-surface" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-primary">{user.username}</span>
                      {user.fullName && <span className="text-sm text-text-secondary">{user.fullName}</span>}
                    </div>
                  </Link>

                  {/* Render FollowButton if we are looking at our own list, or if we want to follow someone else's following list */}
                  {authUser._id !== user._id && (
                    <div className="ml-4">
                      <FollowButton userId={user._id} />
                    </div>
                  )}
                </motion.div>
              );
            })}
            
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;
