import { useEffect, useRef } from "react";

/**
 * useInfiniteScroll
 * Calls `onIntersect` when the sentinel element enters the viewport.
 *
 * @param {Function} onIntersect - fired when sentinel is visible
 * @param {boolean}  enabled     - pause when fetching or no more pages
 */
const useInfiniteScroll = (onIntersect, enabled = true) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect();
      },
      {
        root: null,       // viewport
        rootMargin: "0px",
        threshold: 0.1,   // trigger when 10% visible
      }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [onIntersect, enabled]);

  return sentinelRef;
};

export default useInfiniteScroll;