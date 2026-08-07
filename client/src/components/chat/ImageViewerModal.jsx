import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export const ImageViewerModal = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div className="absolute top-4 right-4 flex gap-4 z-50">
          <a 
            href={src} 
            download 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Download className="w-6 h-6" />
          </a>
          <button 
            onClick={onClose}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          src={src} 
          alt="Full screen viewer" 
          className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
        />
      </motion.div>
    </AnimatePresence>
  );
};
