import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, BadgeCheck, Users, Flame } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useSelector } from "react-redux";
import { trackEvent } from "../../utils/analytics";

const PopularCreatorsCarousel = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await api.get('/api/users/popular?limit=10');
        if (res.data.success) {
          setCreators(res.data.data);
          // Initialize following map locally if needed, assuming we have currentUser.following array
          // Since the endpoint doesn't return amIFollowing, we check against currentUser context
          const initialFollowing = {};
          if (currentUser?.following) {
            res.data.data.forEach(creator => {
              initialFollowing[creator._id] = currentUser.following.includes(creator._id);
            });
          }
          setFollowingMap(initialFollowing);
        }
      } catch (err) {
        console.error("Failed to fetch popular creators", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCreators();
  }, [currentUser]);

  const handleFollowToggle = async (e, targetId) => {
    e.preventDefault(); // Prevent link navigation
    if (!currentUser || processingId) return;

    const isCurrentlyFollowing = followingMap[targetId];
    setProcessingId(targetId);

    // Optimistic UI Update
    setFollowingMap(prev => ({ ...prev, [targetId]: !isCurrentlyFollowing }));

    try {
      if (isCurrentlyFollowing) {
        await api.delete(`/api/users/${targetId}/follow`);
      } else {
        await api.post(`/api/users/${targetId}/follow`);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      // Revert optimistic update on failure
      setFollowingMap(prev => ({ ...prev, [targetId]: isCurrentlyFollowing }));
    } finally {
      setProcessingId(null);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="w-full mb-10">
      <div className="flex items-center gap-2 mb-4 px-2" aria-hidden="true">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-xl font-bold text-text-primary" id="popular-creators-heading">Popular Creators</h2>
      </div>

      <div 
        className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 no-scrollbar snap-x snap-mandatory"
        role="region"
        aria-labelledby="popular-creators-heading"
      >
        {creators.map((creator, index) => {
          const isFollowing = followingMap[creator._id];
          return (
            <motion.div
              key={creator._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="snap-start shrink-0 w-[180px] md:w-[200px]"
            >
              <div
                className="block glass-card rounded-3xl p-5 flex flex-col items-center text-center hover:bg-bg-surface-hover transition-colors border border-border-soft group relative"
              >
                <Link
                  to={`/app/profile/${creator._id}`}
                  onClick={() => trackEvent('recommendation_click', creator._id, { source: 'popular_creators', username: creator.username })}
                  className="absolute inset-0 z-10 rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
                  aria-label={`View ${creator.username}'s profile`}
                />
                
                {/* Ranking Badge */}
                <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-bg-base border-2 border-border-soft flex items-center justify-center text-xs font-bold text-text-secondary z-20 shadow-sm">
                  #{index + 1}
                </div>

                <div className="relative mb-3">
                  <img
                    src={creator.profilePicture || creator.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                    alt={creator.username}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-bg-base shadow-lg group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {creator.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-bg-base rounded-full p-0.5 shadow-sm">
                      <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-text-primary truncate w-full mb-0.5">
                  {creator.fullName || creator.username}
                </h3>
                <p className="text-xs text-text-secondary truncate w-full mb-4">
                  @{creator.username}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-4 bg-bg-base/50 px-3 py-1 rounded-full relative z-10" aria-label={`${creator.followerCount} followers`}>
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatNumber(creator.followerCount)}
                </div>

                <button
                  onClick={(e) => handleFollowToggle(e, creator._id)}
                  disabled={processingId === creator._id}
                  aria-label={isFollowing ? `Unfollow ${creator.username}` : `Follow ${creator.username}`}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all relative z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 ${
                    isFollowing
                      ? "bg-bg-surface border border-border-soft text-text-primary hover:bg-bg-surface-hover"
                      : "bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg shadow-primary-500/20"
                  }`}
                >
                  {processingId === creator._id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PopularCreatorsCarousel;
