import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Heart } from "lucide-react";
import { cn } from "../../utils/cn";

export function FeedVideoItem({ src, altText }) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center group" onClick={toggleMute}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
        aria-label={altText || "Video post"}
      />
      <button 
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all z-20 shadow-lg border border-white/10"
        title={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
      </button>
    </div>
  );
}

export const PostMediaCarousel = ({ mediaItems, onDoubleTap, showHeartOverlay }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const carouselRef = useRef(null);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollPosition = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;
    setCurrentMediaIndex(Math.round(scrollPosition / width));
  };
  
  const scrollTo = (index) => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
  };

  // If there are multiple items, we enforce a consistent aspect ratio to avoid layout shifts when swiping.
  // If it's a single item, we allow it to adapt to its natural size up to a maximum height.
  const isCarousel = mediaItems.length > 1;

  return (
    <div className="flex flex-col">
      <div 
        className="relative w-full bg-black/95 overflow-hidden group shadow-inner select-none flex items-center justify-center aspect-[4/5] sm:aspect-square md:aspect-[4/5]"
        onTouchEnd={onDoubleTap}
        onDoubleClick={onDoubleTap}
      >
        <div 
          ref={carouselRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x hide-scrollbar"
        >
          {mediaItems.map((media, idx) => (
            <div key={idx} className="min-w-full h-full shrink-0 snap-center relative flex items-center justify-center bg-black/90 overflow-hidden">
              {/* Blurred background fill for images to handle varying aspect ratios gracefully */}
              {media.type !== 'video' && (
                <img
                  src={media.url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                />
              )}
              {media.type === 'video' ? (
                <div className="absolute inset-0 z-10">
                  <FeedVideoItem src={media.url} altText={media.altText} />
                </div>
              ) : (
                <img 
                  src={media.url} 
                  alt={media.altText || "Post content"} 
                  className="absolute inset-0 z-10 w-full h-full object-contain"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Navigation arrows (desktop) */}
        {isCarousel && (
          <>
            {currentMediaIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); scrollTo(currentMediaIndex - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition opacity-0 group-hover:opacity-100 hidden sm:block"
                aria-label="Previous media"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
            {currentMediaIndex < mediaItems.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); scrollTo(currentMediaIndex + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition opacity-0 group-hover:opacity-100 hidden sm:block"
                aria-label="Next media"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </>
        )}
        
        {/* Double Tap Heart Overlay */}
        {showHeartOverlay && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </div>
      
      {/* Dots Indicator */}
      {isCarousel && (
        <div className="flex justify-center gap-1.5 pt-3 pb-1 w-full bg-bg-surface">
          {mediaItems.map((_, idx) => (
            <div 
              key={idx} 
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors", 
                idx === currentMediaIndex ? "bg-primary-500" : "bg-text-secondary/30"
              )} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
