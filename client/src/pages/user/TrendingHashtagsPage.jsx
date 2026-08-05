import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Hash, TrendingUp, Flame, ArrowUpRight, ArrowDownRight, Activity, Search } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";

const TrendingHashtagsPage = () => {
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get("/api/posts/trending-hashtags?limit=30");
        if (res.data.success) setHashtags(res.data.data);
      } catch (e) {
        console.error("Failed to fetch trending hashtags", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const topThree = hashtags.slice(0, 3);
  const remaining = hashtags.slice(3);

  return (
    <div className="w-full max-w-5xl mx-auto pt-4 pb-24 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-xl hover:bg-bg-surface"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl hero-gradient">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Trending</h1>
            <p className="text-text-secondary text-sm">Discover what's happening right now</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      ) : hashtags.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-2xl">
          <Hash className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <p className="font-semibold text-text-primary">No hashtags yet</p>
          <p className="text-sm text-text-secondary mt-1">Hashtags appear when people post with #tags in their captions.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Highlight Cards (Top 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((item, index) => (
              <motion.div
                key={item.tag}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Link
                  to={`/app/hashtag/${item.tag}`}
                  className="block glass-card rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300 group border border-border-soft relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Hash className="w-32 h-32 text-primary-500 -rotate-12 transform translate-x-8 -translate-y-8" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                        ${index === 0 ? "bg-yellow-500/20 text-yellow-500 ring-2 ring-yellow-500/30" :
                          index === 1 ? "bg-slate-300/20 text-slate-300 ring-2 ring-slate-300/30" :
                          "bg-orange-500/20 text-orange-500 ring-2 ring-orange-500/30"}`}
                      >
                        #{index + 1}
                      </div>
                      
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${item.growth >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {item.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(item.growth)}%
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-text-primary group-hover:text-primary-500 transition-colors mb-2 truncate">
                      #{item.tag}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border-soft">
                      <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <Activity className="w-4 h-4" />
                        <span className="font-semibold text-text-primary">{formatNumber(item.count)}</span> posts
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <Search className="w-4 h-4" />
                        <span className="font-semibold text-text-primary">{formatNumber(item.searchVolume || 0)}</span> est. volume
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Remaining List */}
          {remaining.length > 0 && (
            <div className="bg-bg-surface border border-border-soft rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border-soft bg-bg-surface-hover/50">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  More Trending Topics
                </h2>
              </div>
              <div className="divide-y divide-border-soft">
                {remaining.map((item, idx) => {
                  const globalRank = idx + 4;
                  return (
                    <motion.div
                      key={item.tag}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (idx % 10) * 0.05 }}
                    >
                      <Link
                        to={`/app/hashtag/${item.tag}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6 hover:bg-bg-surface-hover transition-colors group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-8 text-center font-bold text-text-secondary group-hover:text-primary-500 transition-colors">
                            {globalRank}
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-bg-base border border-border-soft flex items-center justify-center flex-shrink-0 group-hover:border-primary-500/50 transition-colors">
                            <Hash className="w-6 h-6 text-text-primary group-hover:text-primary-500 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-text-primary truncate mb-1">
                              {item.tag}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-text-secondary">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5" />
                                {formatNumber(item.count)} posts
                              </span>
                              <span className="w-1 h-1 rounded-full bg-border-soft" />
                              <span className="flex items-center gap-1">
                                <Search className="w-3.5 h-3.5" />
                                {formatNumber(item.searchVolume || 0)} vol
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Growth Badge */}
                        <div className="sm:ml-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-16 sm:pl-0">
                          <span className="text-xs text-text-secondary sm:mb-1">Weekly Growth</span>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${item.growth >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                            {item.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(item.growth)}%
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendingHashtagsPage;
