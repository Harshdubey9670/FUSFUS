import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

/**
 * LazyImage implements IntersectionObserver to defer loading off-screen images.
 * Provides a smooth blur-up effect or skeleton state before loading.
 */
export const LazyImage = ({ src, alt, className, containerClassName, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Use IntersectionObserver to detect when image is near viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only need to load once
        }
      },
      { rootMargin: '200px' } // Start loading 200px before it enters viewport
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef} 
      className={cn("relative overflow-hidden bg-bg-surface-hover", containerClassName)}
    >
      {/* Blurred Placeholder / Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-bg-surface-hover animate-pulse z-0" />
      )}
      
      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            className,
            "transition-opacity duration-500 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
    </div>
  );
};
