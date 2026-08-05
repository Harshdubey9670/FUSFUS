import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * A reusable fallback component to display when data fails to load, complete with a Retry button.
 */
export const ErrorState = ({ 
  title = "Something went wrong", 
  message = "We couldn't load this content. Please try again.", 
  onRetry,
  className 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center py-16 px-4 text-center bg-bg-surface rounded-2xl border border-border-soft", className)}
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm mb-6 max-w-sm">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </motion.div>
  );
};
