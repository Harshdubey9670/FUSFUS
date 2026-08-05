import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const LiveLikes = ({ streamId, isHost }) => {
  const { socket } = useSocket();
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleLike = () => {
      const id = Date.now() + Math.random();
      // Random x offset between -20 and 20
      const xOffset = Math.random() * 40 - 20;
      setLikes((prev) => [...prev, { id, xOffset }]);
      
      // Remove after animation completes (approx 2s)
      setTimeout(() => {
        setLikes((prev) => prev.filter(like => like.id !== id));
      }, 2000);
    };

    socket.on('live-like', handleLike);

    return () => {
      socket.off('live-like', handleLike);
    };
  }, [socket]);

  const sendLike = () => {
    if (socket) {
      socket.emit('live-like', { streamId });
    }
  };

  return (
    <>
      {/* Floating Hearts Area */}
      <div className="absolute bottom-32 right-4 w-12 h-64 pointer-events-none z-50">
        <AnimatePresence>
          {likes.map((like) => (
            <motion.div
              key={like.id}
              initial={{ opacity: 0, y: 50, x: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: -200, 
                x: [0, like.xOffset, -like.xOffset, like.xOffset],
                scale: [0.5, 1.2, 1]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-0 text-red-500 drop-shadow-lg"
            >
              <Heart className="w-8 h-8 fill-current" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Like Button (Only for viewers) */}
      {!isHost && (
        <button
          onClick={sendLike}
          className="absolute bottom-20 right-4 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-50 shadow-lg"
        >
          <Heart className="w-6 h-6" />
        </button>
      )}
    </>
  );
};
