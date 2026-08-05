import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useToast } from './Toast';

/**
 * A global banner that displays when the user loses network connectivity.
 */
export const NetworkBanner = () => {
  const isOnline = useNetworkStatus();
  const { showToast } = useToast();
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
    } else if (isOnline && hasBeenOffline) {
      // User just came back online
      showToast('Back online!', 'success');
      setHasBeenOffline(false);
    }
  }, [isOnline, hasBeenOffline, showToast]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none"
        >
          <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto text-sm font-semibold">
            <WifiOff className="w-4 h-4" />
            <span>You are offline. Some features may be unavailable.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
