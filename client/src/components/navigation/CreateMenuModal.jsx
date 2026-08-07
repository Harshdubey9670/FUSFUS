import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, Camera, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateMenuModal = ({ isOpen, onClose, onOpenCreatePost }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const menuItems = [
    {
      label: 'Create Post',
      icon: ImageIcon,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      action: () => {
        onClose();
        onOpenCreatePost();
      }
    },
    {
      label: 'Upload Reel',
      icon: Video,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      action: () => {
        onClose();
        navigate('/app/reels/create');
      }
    },
    {
      label: 'Create Story',
      icon: Camera,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
      action: () => {
        onClose();
        navigate('/app/story/create');
      }
    },
    {
      label: 'Go Live',
      icon: Radio,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      action: () => {
        onClose();
        navigate('/app/live/new');
      }
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-sm bg-bg-surface border border-border-soft rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden pb-safe"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-soft/50">
            <h3 className="font-bold text-lg text-text-primary">Create</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bg-base transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-bg-base hover:bg-bg-surface-hover active:scale-95 transition-all border border-border-soft/50 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg} group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="font-semibold text-sm text-text-primary">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
