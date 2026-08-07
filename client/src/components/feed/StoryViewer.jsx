import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";

// Standard duration for image stories
const STORY_DURATION = 5000; 
const QUICK_EMOJIS = ["❤️", "🔥", "😂", "😮", "😢", "👏"];

export const StoryViewer = ({ stories, initialUserIndex, onClose }) => {
  const { user: authUser } = useSelector(state => state.auth);
  const { toast } = useToast();

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Footer state
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const currentUserGroup = stories[userIndex];
  const currentStory = currentUserGroup?.stories[storyIndex];
  const isOwnStory = currentUserGroup?.user._id === authUser?._id;

  // When story changes, reset progress and view state
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setReplyText("");
    setShowViewers(false);

    // Track View
    if (currentStory && !isOwnStory) {
      // Optimistically add to local array so we don't spam if we swipe back and forth
      const alreadyViewed = currentStory.viewers?.some(v => v._id === authUser._id || v === authUser._id);
      if (!alreadyViewed) {
        api.put(`/api/stories/${currentStory._id}/view`).catch(e => console.error("Failed to mark viewed", e));
        if (currentStory.viewers) {
           currentStory.viewers.push(authUser);
        }
      }
    }
  }, [userIndex, storyIndex, currentStory, isOwnStory, authUser]);

  // Handle auto progression
  useEffect(() => {
    if (!currentStory || showViewers) return;

    const isVideo = currentStory.media?.[0]?.type === 'video';

    if (isVideo) {
      if (!isPaused && videoRef.current) {
        videoRef.current.play().catch(e => console.error("Video play blocked", e));
      } else if (isPaused && videoRef.current) {
        videoRef.current.pause();
      }
      return; 
    }

    if (!isPaused) {
      const step = 50; 
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (step / STORY_DURATION) * 100;
          if (next >= 100) {
            handleNext();
            return 100;
          }
          return next;
        });
      }, step);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory, isPaused, showViewers]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleNext = () => {
    if (storyIndex < currentUserGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (userIndex < stories.length - 1) {
      setUserIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (userIndex > 0) {
      setUserIndex((prev) => prev - 1);
      setStoryIndex(stories[userIndex - 1].stories.length - 1);
    } else {
      setProgress(0);
    }
  };

  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = (e) => {
    setIsPaused(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const sendReaction = async (message) => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    // Briefly pause while sending
    setIsPaused(true);
    try {
      await api.post(`/api/stories/${currentStory._id}/reply`, { message });
      toast({ variant: "success", title: "Sent", description: message.length > 2 ? `Replied: ${message}` : `Reacted with ${message}` });
      setReplyText("");
    } catch (error) {
      toast({ variant: "error", title: "Failed to send", description: "Please try again." });
    } finally {
      setIsSending(false);
      setIsPaused(false);
    }
  };

  if (!currentUserGroup || !currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        drag={!showViewers ? "y" : false} // Disable drag-to-close when viewers modal is open
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(e, info) => {
          if (!showViewers && info.offset.y > 100) onClose();
        }}
      >
        <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-3xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col">
          
          {/* Top Progress Bars */}
          <div className="absolute top-0 left-0 w-full z-20 flex gap-1 p-2 pt-4 md:pt-4">
            {currentUserGroup.stories.map((s, idx) => {
              let width = "0%";
              if (idx < storyIndex) width = "100%";
              if (idx === storyIndex) width = `${progress}%`;
              
              return (
                <div key={s._id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                  <div className="h-full bg-white transition-all duration-75 ease-linear" style={{ width }} />
                </div>
              );
            })}
          </div>

          {/* Header Area */}
          <div className="absolute top-6 left-0 w-full z-20 flex items-center justify-between px-4 pb-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <Link 
              to={`/app/profile/${currentUserGroup.user._id}`} 
              className="flex items-center gap-3 group pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                <img src={currentUserGroup.user.profilePicture || "https://i.pravatar.cc/150"} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold text-sm shadow-sm">{currentUserGroup.user.username}</span>
            </Link>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors pointer-events-auto"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Media Content */}
          <div 
            className="flex-1 relative cursor-pointer overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            style={{ touchAction: "none" }}
          >
            {currentStory.media?.[0]?.type === 'video' ? (
              <video
                ref={videoRef}
                src={currentStory.media[0].url}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleNext}
              />
            ) : (
              <img
                src={currentStory.media?.[0]?.url || currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}

            {/* Interactive Stickers Render Overlay */}
            {currentStory.stickers?.map((st, idx) => (
              <div
                key={idx}
                className="absolute p-3 bg-black/75 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl z-20 pointer-events-auto text-white max-w-[220px]"
                style={{ left: `${st.position?.x || 50}%`, top: `${st.position?.y || 50}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {st.type === 'poll' && (
                  <div className="text-center space-y-2 text-xs">
                    <p className="font-bold text-yellow-300">{st.data.question}</p>
                    <div className="grid grid-cols-2 gap-1.5 font-bold">
                      <button onClick={() => toast.success("Vote recorded!")} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg">{st.data.optionA}</button>
                      <button onClick={() => toast.success("Vote recorded!")} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg">{st.data.optionB}</button>
                    </div>
                  </div>
                )}

                {st.type === 'question' && (
                  <div className="text-center space-y-1.5 text-xs">
                    <p className="font-bold text-blue-300">{st.data.prompt}</p>
                    <button onClick={() => toast.success("Opening question response")} className="p-2 bg-white/10 w-full rounded-xl text-white/80 text-[10px] font-semibold">
                      Send Answer
                    </button>
                  </div>
                )}

                {st.type === 'countdown' && (
                  <div className="text-center space-y-1 text-xs">
                    <p className="font-extrabold uppercase tracking-wider text-rose-400">{st.data.title}</p>
                    <div className="text-lg font-black font-mono">00 : 42 : 19</div>
                  </div>
                )}

                {st.type === 'link' && (
                  <a href={st.data.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline">
                    <span>{st.data.label || st.data.url}</span>
                  </a>
                )}

                {st.type === 'mention' && (
                  <div className="font-extrabold text-xs text-primary-400">
                    {st.data.handle}
                  </div>
                )}

                {st.type === 'location' && (
                  <div className="font-bold text-xs text-amber-400">
                    {st.data.location}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Area: Reactions & Replies OR Viewers */}
          <div 
            className="absolute bottom-0 left-0 w-full z-20 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-3"
            onPointerDown={(e) => e.stopPropagation()} // Prevent touches here from triggering navigation
            onPointerUp={(e) => e.stopPropagation()}
          >
            {isOwnStory ? (
              // Own Story Footer
              <div className="flex justify-between items-center w-full">
                <button 
                  onClick={() => {
                    setShowViewers(true);
                    setIsPaused(true);
                  }}
                  className="flex items-center gap-2 text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-4 py-2 rounded-full transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-semibold">{currentStory.viewers?.length || 0} Viewers</span>
                </button>
              </div>
            ) : (
              // Other User Footer
              <div className="flex flex-col gap-3 w-full">
                {/* Quick Emojis */}
                <div className="flex justify-center gap-2 md:gap-4 px-2">
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      disabled={isSending}
                      className="text-2xl hover:scale-125 transition-transform disabled:opacity-50"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                
                {/* Text Reply */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendReaction(replyText);
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  <input 
                    type="text" 
                    placeholder={`Reply to ${currentUserGroup.user.username}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    className="flex-1 bg-black/40 hover:bg-black/50 focus:bg-black/60 text-white placeholder:text-white/60 border border-white/20 rounded-full px-5 py-3 outline-none backdrop-blur-md transition-colors"
                  />
                  {replyText.trim() && (
                    <button 
                      type="submit"
                      disabled={isSending}
                      className="p-3 bg-primary-500 rounded-full text-white shrink-0 hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Viewers Modal (Bottom Sheet) */}
          <AnimatePresence>
            {showViewers && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 w-full h-[60%] bg-bg-surface z-30 rounded-t-3xl flex flex-col shadow-2xl"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-border-soft">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-text-primary" />
                    <h3 className="font-bold text-text-primary text-lg">Viewers</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowViewers(false);
                      setIsPaused(false);
                    }}
                    className="p-2 bg-bg-surface-hover rounded-full text-text-secondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentStory.viewers && currentStory.viewers.length > 0 ? (
                    currentStory.viewers.map((viewer, idx) => (
                      <Link 
                        key={idx}
                        to={`/app/profile/${viewer._id}`}
                        onClick={() => onClose()}
                        className="flex items-center gap-3 hover:bg-bg-surface-hover p-2 -mx-2 rounded-xl transition-colors"
                      >
                        <img src={viewer.profilePicture || "https://i.pravatar.cc/150"} alt="" className="w-10 h-10 rounded-full object-cover border border-border-soft" />
                        <span className="font-semibold text-text-primary">{viewer.username}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center text-text-secondary mt-10">
                      No viewers yet.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
