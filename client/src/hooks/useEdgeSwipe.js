import { useEffect, useRef } from 'react';

/**
 * A custom hook to detect edge swipes on mobile/tablet devices.
 * 
 * @param {Object} options 
 * @param {Function} options.onSwipeRight - Callback fired when swiping right from the left edge.
 * @param {Function} options.onSwipeLeft - Callback fired when swiping left from the right edge.
 * @param {number} options.edgeThreshold - Distance from the edge (in px) where the swipe must originate.
 * @param {number} options.swipeThreshold - Minimum horizontal distance required to trigger the swipe.
 * @param {boolean} options.enabled - Toggle the listener on/off.
 */
export const useEdgeSwipe = ({
  onSwipeRight,
  onSwipeLeft,
  onSwipeDown,
  edgeThreshold = 50,
  swipeThreshold = 50,
  enabled = true
}) => {
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      // Only track single touch
      if (e.touches.length !== 1) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const { x: startX, y: startY, time: startTime } = touchStartRef.current;
      
      const deltaX = touchEndX - startX;
      const deltaY = touchEndY - startY;
      const timeElapsed = Date.now() - startTime;

      // Reset touch ref
      touchStartRef.current = null;

      // Ignore slow swipes (e.g., holding the screen)
      if (timeElapsed > 500) return;

      // Determine if swipe is mostly vertical or horizontal
      const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

      if (isVertical) {
        // Swipe Down (from Top Edge)
        // Allow a slightly larger edge threshold for top swipes because of browser address bars
        if (onSwipeDown && deltaY > swipeThreshold && startY <= edgeThreshold + 50) {
          onSwipeDown();
        }
      } else {
        const screenWidth = window.innerWidth;

        // Swipe Right (from Left Edge)
        if (onSwipeRight && deltaX > swipeThreshold && startX <= edgeThreshold) {
          onSwipeRight();
        }

        // Swipe Left (from Right Edge)
        if (onSwipeLeft && deltaX < -swipeThreshold && startX >= screenWidth - edgeThreshold) {
          onSwipeLeft();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeRight, onSwipeLeft, edgeThreshold, swipeThreshold]);
};
