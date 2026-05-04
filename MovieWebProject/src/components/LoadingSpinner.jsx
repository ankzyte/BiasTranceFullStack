import "../css/LoadingSpinner.css";

/**
 * LoadingSpinner
 * Acts as both:
 *  1. The IntersectionObserver sentinel (via forwarded ref)
 *  2. A visual loading indicator while fetching
 *
 * Props:
 *  sentinelRef - ref attached to the sentinel div
 *  loading     - show spinner when true
 *  hasMore     - show "end of results" when false
 */
const LoadingSpinner = ({ sentinelRef, loading, hasMore }) => {
  return (
    <div className="ls-wrapper" ref={sentinelRef}>
      {loading && (
        <div className="ls-spinner-ring">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      {!hasMore && !loading && (
        <p className="ls-end-message">✦ You've seen it all ✦</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
