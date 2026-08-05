import { useState } from 'react';
import { getCdnUrl } from '../../utils/cdn';

export const OptimizedImage = ({ 
  src, 
  alt = 'Media image', 
  width = 800, 
  quality = 80, 
  className = '', 
  fallbackSrc = 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = getCdnUrl(hasError ? fallbackSrc : src, { width, quality });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton Blur Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-bg-surface-hover animate-pulse rounded-inherit" />
      )}

      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
