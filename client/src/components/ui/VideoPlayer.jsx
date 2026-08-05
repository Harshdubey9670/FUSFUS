import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  RotateCcw,
  Loader2,
} from "lucide-react";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const formatTime = (secs) => {
  if (!isFinite(secs) || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

/* ─── VideoPlayer ──────────────────────────────────────────────────────────── */
/**
 * Props:
 *  src         string   — video source URL (required)
 *  poster      string   — thumbnail image shown before play
 *  autoPlay    bool     — start playing on mount (default false)
 *  loop        bool     — loop the video (default false)
 *  muted       bool     — start muted (default false)
 *  controls    bool     — show custom controls (default true)
 *  className   string   — extra classes for the wrapper
 *  onEnded     func     — called when video reaches the end
 *  onTimeUpdate func    — called on every timeupdate with currentTime
 */
const VideoPlayer = forwardRef(
  (
    {
      src,
      poster,
      autoPlay = false,
      loop = false,
      muted: mutedProp = false,
      controls = true,
      className = "",
      onEnded,
      onTimeUpdate,
    },
    ref
  ) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const seekRef = useRef(null);
    const hideTimer = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(mutedProp);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPip, setIsPip] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [ended, setEnded] = useState(false);
    const [seeking, setSeeking] = useState(false);

    /* ── Expose imperative handle so parent can call play/pause externally ── */
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (t) => { if (videoRef.current) videoRef.current.currentTime = t; },
      get currentTime() { return videoRef.current?.currentTime ?? 0; },
      get duration() { return videoRef.current?.duration ?? 0; },
      get paused() { return videoRef.current?.paused ?? true; },
    }));

    /* ── Auto-hide controls ── */
    const resetHideTimer = useCallback(() => {
      setShowControls(true);
      clearTimeout(hideTimer.current);
      if (playing) {
        hideTimer.current = setTimeout(() => setShowControls(false), 3000);
      }
    }, [playing]);

    useEffect(() => {
      resetHideTimer();
      return () => clearTimeout(hideTimer.current);
    }, [resetHideTimer]);

    /* ── Fullscreen change listener ── */
    useEffect(() => {
      const onFsChange = () =>
        setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", onFsChange);
      return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    /* ── PiP change listener ── */
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const onEnterPip = () => setIsPip(true);
      const onLeavePip = () => setIsPip(false);
      video.addEventListener("enterpictureinpicture", onEnterPip);
      video.addEventListener("leavepictureinpicture", onLeavePip);
      return () => {
        video.removeEventListener("enterpictureinpicture", onEnterPip);
        video.removeEventListener("leavepictureinpicture", onLeavePip);
      };
    }, []);

    /* ── Event handlers ── */
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => {
      setPlaying(false);
      setEnded(true);
      onEnded?.();
    };
    const handleTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || seeking) return;
      setCurrentTime(v.currentTime);
      onTimeUpdate?.(v.currentTime);
      // update buffered
      if (v.buffered.length > 0) {
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(videoRef.current?.duration ?? 0);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    /* ── Controls ── */
    const togglePlay = () => {
      const v = videoRef.current;
      if (!v) return;
      setEnded(false);
      if (v.paused) { v.play(); } else { v.pause(); }
    };

    const replay = () => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = 0;
      v.play();
      setEnded(false);
    };

    const handleSeekChange = (e) => {
      const pct = parseFloat(e.target.value);
      const t = (pct / 100) * duration;
      setCurrentTime(t);
      if (videoRef.current) videoRef.current.currentTime = t;
    };

    const handleVolumeChange = (e) => {
      const v = parseFloat(e.target.value);
      setVolume(v);
      setMuted(v === 0);
      if (videoRef.current) {
        videoRef.current.volume = v;
        videoRef.current.muted = v === 0;
      }
    };

    const toggleMute = () => {
      const v = videoRef.current;
      if (!v) return;
      if (muted) {
        v.muted = false;
        v.volume = volume || 1;
        setMuted(false);
      } else {
        v.muted = true;
        setMuted(true);
      }
    };

    const toggleFullscreen = async () => {
      const el = containerRef.current;
      if (!el) return;
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    };

    const togglePip = async () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture();
      }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isPipSupported = !!document.pictureInPictureEnabled;

    return (
      <div
        ref={containerRef}
        className={`relative group bg-black overflow-hidden rounded-2xl ${className}`}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => playing && setShowControls(false)}
        onTouchStart={resetHideTimer}
      >
        {/* ── Video Element ── */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          onClick={togglePlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
        />

        {/* ── Buffering Spinner ── */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
          </div>
        )}

        {/* ── Centre Play/Pause overlay tap ── */}
        {!controls && (
          <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />
        )}

        {/* ── Replay overlay ── */}
        {ended && !loop && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <button
              onClick={replay}
              className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform"
            >
              <RotateCcw className="w-14 h-14" />
              <span className="text-sm font-semibold">Replay</span>
            </button>
          </div>
        )}

        {/* ── Custom Controls ── */}
        {controls && (
          <div
            className={`absolute bottom-0 left-0 w-full transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Gradient for readability */}
            <div className="w-full h-24 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 pointer-events-none rounded-b-2xl" />

            <div className="relative px-4 pb-3 pt-8 flex flex-col gap-2">
              {/* ── Seek Bar ── */}
              <div className="relative h-1.5 rounded-full bg-white/20 group/seek cursor-pointer">
                {/* Buffered track */}
                <div
                  className="absolute h-full rounded-full bg-white/30"
                  style={{ width: `${buffered}%` }}
                />
                {/* Played track */}
                <div
                  className="absolute h-full rounded-full bg-white"
                  style={{ width: `${progress}%` }}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
                {/* Range input (transparent, on top) */}
                <input
                  ref={seekRef}
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={progress}
                  onChange={handleSeekChange}
                  onMouseDown={() => setSeeking(true)}
                  onMouseUp={() => setSeeking(false)}
                  onTouchStart={() => setSeeking(true)}
                  onTouchEnd={() => setSeeking(false)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  style={{ height: "100%" }}
                />
              </div>

              {/* ── Control Row ── */}
              <div className="flex items-center justify-between gap-3">
                {/* Left: Play + Volume + Time */}
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="text-white hover:scale-110 active:scale-95 transition-transform"
                  >
                    {playing ? (
                      <Pause className="w-6 h-6 fill-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white" />
                    )}
                  </button>

                  {/* Volume group */}
                  <div className="flex items-center gap-2 group/vol">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:scale-110 transition-transform shrink-0"
                    >
                      {muted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    {/* Volume slider — shown on hover (desktop only) */}
                    <div className="hidden md:flex items-center w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 accent-white cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-white/80 text-xs font-mono tabular-nums select-none">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right: PiP + Fullscreen */}
                <div className="flex items-center gap-3">
                  {isPipSupported && (
                    <button
                      onClick={togglePip}
                      title="Picture in Picture"
                      className={`text-white hover:scale-110 transition-transform ${isPip ? "text-primary-400" : ""}`}
                    >
                      <PictureInPicture2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="text-white hover:scale-110 transition-transform"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
