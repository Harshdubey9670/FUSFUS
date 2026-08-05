import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Volume2,
  VolumeX,
  Music2,
  MoreHorizontal,
  Loader2,
  Repeat,
  BarChart3,
  ShieldCheck
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";

/* ─── constants ───────────────────────────────────────────────────────────── */
const DOUBLE_TAP_DELAY = 300; // ms window for double-tap detection

/* ─── ReelItem: one full-screen reel ─────────────────────────────────────── */
const ReelItem = ({ reel, isActive, isMuted, onMuteToggle }) => {
  const { user: authUser } = useSelector((s) => s.auth);
  const { toast } = useToast();

  const videoRef = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);

  const [liked, setLiked] = useState(
    reel.likes?.some((id) => id === authUser?._id || id?._id === authUser?._id)
  );
  const [likesCount, setLikesCount] = useState(reel.likes?.length ?? 0);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 50, y: 50 });
  const [isFollowing, setIsFollowing] = useState(false);

  /* ── Video auto play/pause ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  /* ── Mute sync ── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  /* ── Double-tap to like ── */
  const handleTap = (e) => {
    tapCount.current += 1;

    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0; // single tap — do nothing (or future: pause toggle)
      }, DOUBLE_TAP_DELAY);
    } else if (tapCount.current === 2) {
      clearTimeout(tapTimer.current);
      tapCount.current = 0;

      // Position the heart at the tap location
      const rect = e.currentTarget.getBoundingClientRect();
      setHeartPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });

      if (!liked) {
        triggerLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const triggerLike = async () => {
    setLiked(true);
    setLikesCount((c) => c + 1);
    try {
      await api.put(`/api/reels/${reel._id}/like`);
    } catch {
      setLiked(false);
      setLikesCount((c) => c - 1);
    }
  };

  const handleLikeButton = async () => {
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      try {
        await api.put(`/api/reels/${reel._id}/like`);
      } catch {
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } else {
      triggerLike();
    }
  };

  const handleShare = async () => {
    try {
      await api.put(`/api/reels/${reel._id}/share`);
      if (navigator.share) {
        await navigator.share({ title: reel.caption, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied!" });
      }
    } catch {}
  };

  const formatCount = (n = 0) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden flex-shrink-0"
      onClick={handleTap}
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Video with DRM Download Prevention */}
      <video
        ref={videoRef}
        src={reel.video?.url}
        poster={reel.video?.thumbnailUrl}
        className="absolute inset-0 w-full h-full object-cover select-none"
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        controlsList="nodownload no-share"
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Download Prevention Transparent DRM Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-auto"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute pointer-events-none"
            style={{ left: `${heartPos.x}%`, top: `${heartPos.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right Sidebar Actions ── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar + Follow */}
        <div className="flex flex-col items-center gap-1">
          <Link to={`/app/profile/${reel.user?._id}`}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-primary-500">
              <img
                src={reel.user?.profilePicture || "https://i.pravatar.cc/150"}
                alt={reel.user?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          {!isFollowing && (
            <button
              onClick={() => setIsFollowing(true)}
              className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center -mt-3 border-2 border-black"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>

        {/* Like */}
        <button onClick={handleLikeButton} className="flex flex-col items-center gap-1.5">
          <motion.div whileTap={{ scale: 1.3 }} transition={{ type: "spring", stiffness: 400 }}>
            <Heart
              className={`w-8 h-8 drop-shadow transition-colors ${
                liked ? "text-red-500 fill-red-500" : "text-white fill-white/10"
              }`}
            />
          </motion.div>
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(likesCount)}</span>
        </button>

        {/* Comments (decorative for now) */}
        <button className="flex flex-col items-center gap-1.5">
          <MessageCircle className="w-8 h-8 text-white fill-white/10 drop-shadow" />
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(reel.commentsCount)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1.5">
          <Share2 className="w-8 h-8 text-white drop-shadow" />
          <span className="text-white text-xs font-semibold drop-shadow">{formatCount(reel.sharesCount)}</span>
        </button>

        {/* Remix Reel */}
        <Link to={`/app/reels/create?remix=${reel._id}`} className="flex flex-col items-center gap-1.5" title="Remix this Reel">
          <Repeat className="w-7 h-7 text-white drop-shadow hover:text-primary-400 transition-colors" />
          <span className="text-white text-[10px] font-semibold drop-shadow">Remix</span>
        </Link>

        {/* Mute toggle */}
        <button onClick={onMuteToggle}>
          {isMuted ? (
            <VolumeX className="w-7 h-7 text-white drop-shadow" />
          ) : (
            <Volume2 className="w-7 h-7 text-white drop-shadow" />
          )}
        </button>
      </div>

      {/* ── Bottom Info Overlay ── */}
      <div
        className="absolute left-3 right-16 z-10"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Username */}
        <Link
          to={`/app/profile/${reel.user?._id}`}
          className="text-white font-bold text-base drop-shadow hover:underline"
        >
          @{reel.user?.username}
        </Link>

        {/* Caption */}
        {reel.caption && (
          <p className="text-white/90 text-sm mt-1 leading-snug drop-shadow line-clamp-2">
            {reel.caption}
          </p>
        )}

        {/* Music ticker */}
        {reel.music?.title && (
          <div className="flex items-center gap-2 mt-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
            <Music2 className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-white text-xs font-medium truncate max-w-[180px]">
              {reel.music.title}{reel.music.artist ? ` · ${reel.music.artist}` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


/* ─── Main ReelsPage ──────────────────────────────────────────────────────── */
const ReelsPage = () => {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef(null);
  const isFirstLoad = useRef(true);

  /* ── Fetch reels ── */
  const fetchReels = useCallback(async (pageNum) => {
    pageNum === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api.get(`/api/reels?page=${pageNum}&limit=8`);
      if (res.data.success) {
        setReels((prev) => pageNum === 1 ? res.data.data : [...prev, ...res.data.data]);
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (err) {
      console.error("Failed to load reels:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchReels(1); }, [fetchReels]);

  /* ── IntersectionObserver for active reel + infinite scroll ── */
  useEffect(() => {
    const items = containerRef.current?.querySelectorAll("[data-reel-item]");
    if (!items?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.reelIndex, 10);
            setActiveIndex(idx);

            // Track view on first enter
            if (entry.target.dataset.reelId) {
              api.put(`/api/reels/${entry.target.dataset.reelId}/view`).catch(() => {});
            }

            // Load more if close to the end
            if (idx >= reels.length - 2 && hasMore && !loadingMore) {
              setPage((p) => {
                const next = p + 1;
                fetchReels(next);
                return next;
              });
            }
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reels, hasMore, loadingMore, fetchReels]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-40">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (!reels.length) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-40">
        <p className="text-white text-xl font-bold">No reels yet</p>
        <Link
          to="/app/reels/create"
          className="px-6 py-3 rounded-full hero-gradient text-white font-semibold"
        >
          Upload the first one
        </Link>
      </div>
    );
  }

  return (
    /* Full-screen reel container */
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 bg-black overflow-y-scroll no-scrollbar"
      style={{
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      {reels.map((reel, idx) => (
        <div
          key={reel._id}
          data-reel-item
          data-reel-index={idx}
          data-reel-id={reel._id}
          className="reel-item w-full flex-shrink-0"
        >
          <ReelItem
            reel={reel}
            isActive={idx === activeIndex}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted((m) => !m)}
          />
        </div>
      ))}

      {/* Loading more spinner */}
      {loadingMore && (
        <div
          className="w-full flex items-center justify-center bg-black"
          style={{ height: "100dvh", scrollSnapAlign: "start" }}
        >
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ReelsPage;
