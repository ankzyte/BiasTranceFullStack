import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import TrailerModal from "../components/TrailerModal";
import ReviewsModal from "../components/ReviewsModal";
import { useMovieContext } from "../contexts/MovieContext";
import "../css/MovieDetails.css";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// ── helpers ──────────────────────────────────────────────────────────────────
const fetchMovieDetails = (id) =>
  fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`).then((r) =>
    r.json(),
  );

const fetchMovieCredits = (id) =>
  fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`).then((r) =>
    r.json(),
  );

const fetchMovieVideos = (id) =>
  fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`).then((r) =>
    r.json(),
  );

// ── component ─────────────────────────────────────────────────────────────────
const MovieDetails = () => {
  const { id } = useParams();

  // movie data
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // trailer state
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [trailerFetched, setTrailerFetched] = useState(false);
  const [noTrailer, setNoTrailer] = useState(false);

  // reviews state
  const [showReviews, setShowReviews] = useState(false);

  // favorites
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const favorite = movie ? isFavorite(movie.id) : false;

  const handleFavoriteClick = () => {
    if (!movie) return;
    if (favorite) removeFromFavorites(movie.id);
    else addToFavorites(movie);
  };

  // ── load movie + cast on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [details, credits] = await Promise.all([
          fetchMovieDetails(id),
          fetchMovieCredits(id),
        ]);

        if (cancelled) return;

        if (details.success === false) throw new Error("Movie not found");

        setMovie(details);
        setCast(credits.cast?.slice(0, 10) ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── fetch trailer (on demand) ───────────────────────────────────────────────
  const handleWatchTrailer = useCallback(async () => {
    // If we already know the key (or know there's none), act immediately
    if (trailerFetched) {
      if (trailerKey) setShowTrailer(true);
      return;
    }

    setTrailerLoading(true);

    try {
      const data = await fetchMovieVideos(id);

      const trailer = data.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube",
      );

      if (trailer) {
        setTrailerKey(trailer.key);
        setShowTrailer(true);
      } else {
        setNoTrailer(true);
        // Auto-clear the "no trailer" message after 3 s
        setTimeout(() => setNoTrailer(false), 3000);
      }
    } catch {
      setNoTrailer(true);
      setTimeout(() => setNoTrailer(false), 3000);
    } finally {
      setTrailerLoading(false);
      setTrailerFetched(true);
    }
  }, [id, trailerFetched, trailerKey]);

  // ── guards ──────────────────────────────────────────────────────────────────
  if (loading) return <div className="md-state">Loading…</div>;
  if (error)
    return <div className="md-state md-state--error">Error: {error}</div>;
  if (!movie) return null;

  // derived values
  const posterUrl = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : null;
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  const year = movie.release_date?.split("-")[0] ?? "—";
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : "—";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  const genres = movie.genres?.map((g) => g.name) ?? [];

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="md-page">
      {/* Backdrop hero */}
      {backdropUrl && (
        <div
          className="md-hero"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="md-hero__overlay" />
        </div>
      )}

      <div className="md-content">
        {/* Poster */}
        <div className="md-poster">
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} loading="lazy" />
          ) : (
            <div className="md-poster__placeholder">No Image</div>
          )}
        </div>

        {/* Info */}
        <div className="md-info">
          <h1 className="md-info__title">{movie.title}</h1>

          <div className="md-info__meta">
            <span className="md-badge md-badge--rating">⭐ {rating}</span>
            <span className="md-badge">{year}</span>
            <span className="md-badge">{runtime}</span>
          </div>

          {genres.length > 0 && (
            <div className="md-info__genres">
              {genres.map((g) => (
                <span key={g} className="md-genre">
                  {g}
                </span>
              ))}
            </div>
          )}

          <p className="md-info__overview">{movie.overview}</p>

          {/* Buttons row */}
          <div className="md-trailer-area">
            {/* ▶ Watch Trailer */}
            <button
              className="md-btn md-btn--trailer"
              onClick={handleWatchTrailer}
              disabled={trailerLoading}
            >
              {trailerLoading ? (
                <>
                  <span className="md-btn__spinner" />
                  Loading…
                </>
              ) : (
                <>▶ Watch Trailer</>
              )}
            </button>

            {/* ★ Reviews */}
            <button
              className="md-btn md-btn--reviews"
              onClick={() => setShowReviews(true)}
            >
              ★ Reviews
            </button>

            {/* ♥ Favorite */}
            <button
              className={`favorite-btn favorite-btn--detail ${favorite ? "active" : ""}`}
              onClick={handleFavoriteClick}
              aria-label={
                favorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {favorite ? "♥" : "♡"}
            </button>

            {/* "No trailer" feedback */}
            {noTrailer && (
              <span className="md-trailer-area__notice">
                Trailer not available for this title.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cast row */}
      {cast.length > 0 && (
        <section className="md-cast">
          <h2 className="md-cast__heading">Top Cast</h2>
          <div className="md-cast__grid">
            {cast.map((actor) => (
              <div key={actor.id} className="md-cast__card">
                {actor.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                    alt={actor.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="md-cast__no-photo">👤</div>
                )}
                <p className="md-cast__name">{actor.name}</p>
                <p className="md-cast__char">{actor.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trailer modal */}
      {showTrailer && trailerKey && (
        <TrailerModal
          trailerKey={trailerKey}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* Reviews modal */}
      {showReviews && (
        <ReviewsModal
          movieId={id}
          movieTitle={movie.title}
          onClose={() => setShowReviews(false)}
        />
      )}
    </div>
  );
};

export default MovieDetails;
