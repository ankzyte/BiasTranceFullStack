import { useEffect, useCallback, useState } from "react";
import BiasResult from "./BiasResult";
import { analyzeText } from "../services/hooks/biasApi";
import "../css/ReviewsModal.css";
import "../css/BiasResult.css";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const AVATAR_BASE = "https://image.tmdb.org/t/p/w45";

const ReviewsModal = ({ movieId, movieTitle, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  // Per-review bias analysis state: { [reviewId]: { loading, result, error } }
  const [analysisState, setAnalysisState] = useState({});

  // ── fetch reviews ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/movie/${movieId}/reviews?api_key=${API_KEY}&language=en-US`
        );
        const data = await res.json();
        if (!cancelled) setReviews(data.results ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [movieId]);

  // ── keyboard close ─────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Analyze a single review ────────────────────────────────────────────────
  const handleAnalyze = async (review) => {
    const id = review.id;

    // If already analyzed, toggle dismiss
    if (analysisState[id]?.result) {
      setAnalysisState((prev) => ({ ...prev, [id]: undefined }));
      return;
    }

    setAnalysisState((prev) => ({
      ...prev,
      [id]: { loading: true, result: null, error: null },
    }));

    try {
      const result = await analyzeText(review.content);
      setAnalysisState((prev) => ({
        ...prev,
        [id]: { loading: false, result, error: null },
      }));
    } catch (err) {
      setAnalysisState((prev) => ({
        ...prev,
        [id]: { loading: false, result: null, error: err.message },
      }));
    }
  };

  // ── Analyze ALL reviews ────────────────────────────────────────────────────
  const handleAnalyzeAll = async () => {
    // Initialize loading state for all not-yet-analyzed reviews
    const toAnalyze = reviews.filter(
      (r) => !analysisState[r.id]?.result && !analysisState[r.id]?.loading
    );

    toAnalyze.forEach((r) => {
      setAnalysisState((prev) => ({
        ...prev,
        [r.id]: { loading: true, result: null, error: null },
      }));
    });

    // Fire all in parallel
    await Promise.allSettled(
      toAnalyze.map(async (review) => {
        try {
          const result = await analyzeText(review.content);
          setAnalysisState((prev) => ({
            ...prev,
            [review.id]: { loading: false, result, error: null },
          }));
        } catch (err) {
          setAnalysisState((prev) => ({
            ...prev,
            [review.id]: { loading: false, result: null, error: err.message },
          }));
        }
      })
    );
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric",
        })
      : "";

  const getAvatar = (details) => {
    const path = details?.avatar_path ?? "";
    if (!path) return null;
    if (path.startsWith("/https")) return path.slice(1);
    return `${AVATAR_BASE}${path}`;
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const PREVIEW_LENGTH = 320;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="reviews-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Movie Reviews"
    >
      <div className="reviews-modal">
        {/* Header */}
        <div className="reviews-modal__header">
          <span className="reviews-modal__label">★ Reviews</span>
          <span className="reviews-modal__title">{movieTitle}</span>

          {/* Analyze All button */}
          {!loading && reviews.length > 0 && (
            <button className="reviews-analyze-all" onClick={handleAnalyzeAll}>
              ⚡ Analyze All
            </button>
          )}

          <button
            className="reviews-modal__close"
            onClick={onClose}
            aria-label="Close reviews"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="reviews-modal__body">
          {loading && (
            <div className="reviews-state">
              <span className="reviews-spinner" />
              Loading reviews…
            </div>
          )}

          {error && (
            <div className="reviews-state reviews-state--error">
              Failed to load reviews.
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className="reviews-state reviews-state--empty">
              No reviews yet for this title.
            </div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <ul className="reviews-list">
              {reviews.map((review) => {
                const avatar = getAvatar(review.author_details);
                const rating = review.author_details?.rating;
                const isExpanded = expanded[review.id];
                const isLong = review.content.length > PREVIEW_LENGTH;
                const displayText =
                  isLong && !isExpanded
                    ? review.content.slice(0, PREVIEW_LENGTH) + "…"
                    : review.content;

                const bias = analysisState[review.id];
                const isAnalyzing = bias?.loading;
                const analysisResult = bias?.result;
                const analysisError = bias?.error;
                const hasResult = !!analysisResult;

                return (
                  <li key={review.id} className="review-card">
                    {/* Author row */}
                    <div className="review-card__author">
                      <div className="review-card__avatar">
                        {avatar ? (
                          <img src={avatar} alt={review.author} />
                        ) : (
                          <span>{getInitial(review.author)}</span>
                        )}
                      </div>
                      <div className="review-card__meta">
                        <span className="review-card__name">{review.author}</span>
                        <span className="review-card__date">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {rating != null && (
                        <span className="review-card__rating">⭐ {rating}/10</span>
                      )}

                      {/* Per-review Analyze button */}
                      <button
                        className={`review-analyze-btn ${hasResult ? "review-analyze-btn--active" : ""}`}
                        onClick={() => handleAnalyze(review)}
                        disabled={isAnalyzing}
                        title={hasResult ? "Dismiss analysis" : "Analyze for bias"}
                      >
                        {isAnalyzing ? (
                          <span className="review-analyze-btn__spinner" />
                        ) : hasResult ? (
                          "✕ Dismiss"
                        ) : (
                          "⚡ Analyze"
                        )}
                      </button>
                    </div>

                    {/* Review content */}
                    <p className="review-card__content">{displayText}</p>

                    {isLong && (
                      <button
                        className="review-card__toggle"
                        onClick={() => toggleExpand(review.id)}
                      >
                        {isExpanded ? "Show less ▲" : "Read more ▼"}
                      </button>
                    )}

                    {/* Analysis error */}
                    {analysisError && (
                      <div className="review-analyze-error">
                        ⚠ Analysis failed: {analysisError}
                      </div>
                    )}

                    {/* Bias result */}
                    {analysisResult && (
                      <BiasResult
                        result={analysisResult}
                        onClose={() =>
                          setAnalysisState((prev) => ({
                            ...prev,
                            [review.id]: undefined,
                          }))
                        }
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;