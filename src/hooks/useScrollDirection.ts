import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Mobile-friendly scroll direction hook.
 * - Uses touch start/end delta as primary signal on touch devices
 * - Accumulates scroll distance before toggling (no jitter)
 * - Ignores iOS rubber-band / overscroll regions
 * - Auto-shows bar when user stops scrolling
 * - Always shows bar near the top of the page
 */
export function useScrollDirection() {
  const [hidden, setHidden] = useState(false);

  // Touch tracking
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  // Scroll tracking (fallback for non-touch / desktop)
  const lastScrollY = useRef(0);
  const accumulated = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  const SHOW_THRESHOLD = 30;  // px of upward movement to show
  const HIDE_THRESHOLD = 50;  // px of downward movement to hide
  const TOP_ZONE = 80;        // always show bar when near top
  const IDLE_DELAY = 1200;    // ms — show bar after user stops scrolling

  const maxScrollY = useCallback(() => {
    return document.documentElement.scrollHeight - window.innerHeight;
  }, []);

  useEffect(() => {
    // --- Touch-based detection (primary on mobile) ---
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchMoved.current = false;
    };

    const onTouchMove = () => {
      touchMoved.current = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchMoved.current) return; // was a tap, not a scroll

      const currentY = window.scrollY;

      // Always show near top or bottom (overscroll zones)
      if (currentY <= TOP_ZONE || currentY >= maxScrollY() - 10) {
        setHidden(false);
        return;
      }

      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartY.current - touchEndY; // positive = swipe up = scroll down

      if (delta > HIDE_THRESHOLD) {
        setHidden(true);
      } else if (delta < -SHOW_THRESHOLD) {
        setHidden(false);
      }
    };

    // --- Scroll-based detection (fallback for desktop / programmatic scrolls) ---
    const onScroll = () => {
      const currentY = window.scrollY;

      // Ignore overscroll / rubber-banding
      if (currentY < 0 || currentY > maxScrollY() + 50) {
        lastScrollY.current = currentY;
        return;
      }

      // Always show near top
      if (currentY <= TOP_ZONE) {
        setHidden(false);
        accumulated.current = 0;
        lastScrollY.current = currentY;
        return;
      }

      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // Accumulate in the current direction, reset on direction change
      if ((accumulated.current > 0 && diff < 0) || (accumulated.current < 0 && diff > 0)) {
        accumulated.current = 0;
      }
      accumulated.current += diff;

      if (accumulated.current > HIDE_THRESHOLD) {
        setHidden(true);
        accumulated.current = 0;
      } else if (accumulated.current < -SHOW_THRESHOLD) {
        setHidden(false);
        accumulated.current = 0;
      }

      // Auto-show after idle
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setHidden(false);
      }, IDLE_DELAY);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer.current);
    };
  }, [maxScrollY]);

  return hidden;
}
