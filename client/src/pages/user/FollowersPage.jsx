import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2, Search, ArrowLeft, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

const FollowersPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const [followers, setFollowers] = useState([]);
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

  // Fetch Followers
  const fetchFollowers = useCallback(async (pageNum, searchQuery, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/api/users/${id}/followers`, {
        params: { page: pageNum, limit: 15, search: searchQuery }
      });

      if (res.data.success) {
        setFollowers(prev => reset ? res.data.data : [...prev, ...res.data.data]);
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: 'Failed to load followers' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, toast]);

  // Effect for initial load and search change
  useEffect(() => {
    setPage(1);
    fetchFollowers(1, debouncedSearch, true);
  }, [debouncedSearch, fetchFollowers]);

  // Infinite Scroll Observer
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchFollowers(next, debouncedSearch, false);
          return next;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchFollowers, debouncedSearch]);

  const handleRemoveFollower = async (followerId) => {
    try {
      const res = await api.delete(`/api/users/followers/${followerId}`);
      if (res.data.success) {
        setFollowers(prev => prev.filter(f => f._id !== followerId));
        toast({ variant: 'success', title: 'Success', description: 'Follower removed.' });
      }
    } catch (err) {
      toast({ variant: 'error', title: 'Error', description: err.response?.data?.message || 'Could not remove follower.' });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 pt-4 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 glass-card p-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Followers</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input 
          type="text"
          placeholder="Search followers..."
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

      {/* Followers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface rounded-2xl border border-border-soft">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-surface-hover mb-4">
              <Users className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No followers found</h3>
            <p className="text-text-secondary">
              {debouncedSearch ? 'Try a different search term.' : 'When people follow this account, they\'ll show up here.'}
            </p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-border-soft border-none rounded-2xl overflow-hidden">
            {followers.map((follower, index) => {
              const isLast = index === followers.length - 1;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  key={follower._id}
                  ref={isLast ? lastElementRef : null}
                  className="flex items-center justify-between p-4 hover:bg-bg-surface-hover transition-colors"
                >
                  <Link to={`/app/profile/${follower._id}`} className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full hero-gradient p-[2px]">
                      <Avatar src={follower.profilePicture || follower.avatar} alt={follower.username} className="w-full h-full border-2 border-bg-surface" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-primary">{follower.username}</span>
                      {follower.fullName && <span className="text-sm text-text-secondary">{follower.fullName}</span>}
                    </div>
                  </Link>

                  {isOwner && (
                    <Button 
                      variant="ghost" 
                      onClick={() => handleRemoveFollower(follower._id)}
                      className="ml-4 h-8 px-4 text-xs font-semibold text-text-secondary hover:text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
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

export default FollowersPage;
