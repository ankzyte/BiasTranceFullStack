import { useEffect, useCallback } from "react";
import "../css/TrailerModal.css";

const TrailerModal = ({ trailerKey, onClose }) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // prevent background scroll

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="trailer-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Movie Trailer"
    >
      <div className="trailer-modal">
        {/* Header */}
        <div className="trailer-modal__header">
          <span className="trailer-modal__label">▶ Official Trailer</span>
          <button
            className="trailer-modal__close"
            onClick={onClose}
            aria-label="Close trailer"
          >
            ✕
          </button>
        </div>

        {/* YouTube Embed */}
        <div className="trailer-modal__player">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
            title="Movie Trailer"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
