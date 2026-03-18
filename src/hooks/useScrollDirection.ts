import { useState, useEffect, useRef } from 'react';

/**
 * Returns true when the user is scrolling down (action bar should hide).
 * Returns false when scrolling up or at the top (action bar should show).
 */
export function useScrollDirection(threshold = 10) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (diff > threshold) {
        setHidden(true);
      } else if (diff < -threshold) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hidden;
}
