import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../ui/Avatar';

export const ConversationPresenceAvatar = ({ otherUser, isPresent, isTyping }) => {
  if (!otherUser) return null;

  return (
    <AnimatePresence>
      {isPresent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute bottom-2 left-4 z-20 flex items-end gap-2 pointer-events-none"
        >
          <div className="relative">
            {/* The Avatar itself */}
            <motion.div
              animate={
                isTyping 
                  ? { y: [0, -6, 0], scale: [1, 1.05, 1] } 
                  : { y: [0, -3, 0] } // Idle breathing effect
              }
              transition={
                isTyping
                  ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } // Faster bounce when typing
                  : { duration: 3, repeat: Infinity, ease: 'easeInOut' }   // Slow float when idle
              }
              className="relative shadow-lg rounded-full ring-2 ring-bg-base/80"
            >
              <Avatar
                src={otherUser.profilePicture || otherUser.avatar}
                fallback={otherUser.username?.charAt(0)}
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary-500/50"
              />
            </motion.div>

            {/* Typing Indicator Bubble */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-2 -right-2 bg-bg-surface-hover shadow-md rounded-full px-2 py-1 flex items-center gap-0.5 border border-border-soft"
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary-500"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary-500"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
