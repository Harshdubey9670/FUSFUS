import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, AlertTriangle, X, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../ui/Toast';

export function SnapViewerModal({ snap, onClose, onSnapExpired }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(snap.snapTimer || 10);
  const [screenshotAlert, setScreenshotAlert] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    // Screenshot Detection Listeners
    const handleKeyDown = (e) => {
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(e.key.toLowerCase());
      if (e.key === 'PrintScreen' || isMacScreenshot) {
        triggerScreenshotDetection();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        triggerScreenshotDetection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const triggerScreenshotDetection = async () => {
    setScreenshotAlert(true);
    toast({ 
      variant: 'error', 
      title: '📷 Screenshot Detected!', 
      description: `Sender @${snap.sender?.username || 'user'} has been notified of your screenshot.` 
    });

    try {
      await api.post(`/api/messages/snap/${snap._id}/screenshot`);
    } catch (e) {
      console.error('Screenshot reporting failed', e);
    }
  };

  const handleOpenSnap = async () => {
    if (isOpen) return;
    setIsOpen(true);

    try {
      await api.post(`/api/messages/snap/${snap._id}/open`);
    } catch (e) {
      console.error('Open snap failed', e);
    }

    // Start self-destruct countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onSnapExpired && onSnapExpired(snap._id);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      
      {/* Top Header Timer & Actions */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-white text-xs font-bold">
          <Clock className="w-4 h-4 text-secondary-400" />
          <span>{isOpen ? `${timeLeft}s remaining` : `${snap.snapTimer || 10}s Snap`}</span>
        </div>

        {screenshotAlert && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
            <ShieldAlert className="w-4 h-4" /> Screenshot Taken!
          </div>
        )}

        <button onClick={onClose} className="p-2 rounded-full glass text-white hover:bg-white/20">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Snap Display Container */}
      <div className="relative w-full max-w-lg aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
        
        {/* Blur Preview / Tap to View Cover */}
        {!isOpen ? (
          <div 
            onClick={handleOpenSnap}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-gradient-to-b from-primary-900/40 via-bg-base to-black hover:opacity-90 transition-opacity"
          >
            <div className="w-20 h-20 rounded-full hero-gradient flex items-center justify-center mb-4 shadow-glow shadow-primary-500/50 animate-bounce">
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">New Snap from @{snap.sender?.username || 'friend'}</h3>
            <p className="text-sm text-text-secondary mb-6">Tap anywhere to view snap ({snap.snapTimer || 10}s)</p>
            <span className="px-4 py-2 rounded-full glass text-xs font-semibold text-primary-400 border border-primary-500/30">
              🔒 Self-destructs after viewing
            </span>
          </div>
        ) : (
          /* Revealed Unblurred Media */
          <div className="relative w-full h-full flex items-center justify-center">
            {snap.mediaType === 'video' ? (
              <video src={snap.mediaUrl} autoPlay playsInline className="w-full h-full object-contain" />
            ) : (
              <img src={snap.mediaUrl || snap.text} alt="Snap content" className="w-full h-full object-contain" />
            )}

            {/* Countdown Progress Ring */}
            <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full glass border-2 border-primary-500 flex items-center justify-center text-white font-black text-sm z-20 shadow-glow">
              {timeLeft}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
