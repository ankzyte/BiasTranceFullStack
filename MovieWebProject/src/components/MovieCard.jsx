import { Link } from "react-router-dom";
import "../css/MovieCard.css";
import { useMovieContext } from "../contexts/MovieContext";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER = "https://via.placeholder.com/500x750?text=No+Image";

function MovieCard({ movie }) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const favorite = isFavorite(movie.id);

  const onFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (favorite) removeFromFavorites(movie.id);
    else addToFavorites(movie);
  };

  const rating = movie.vote_average?.toFixed(1);
  const releaseYear = movie.release_date?.split("-")[0];

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card-link">
      <div className="movie-card">
        <div className="movie-poster">
          <img
            src={
              movie.poster_path
                ? `${IMG_BASE}${movie.poster_path}`
                : PLACEHOLDER
            }
            alt={movie.title}
            loading="lazy"
          />
          <div className="movie-overlay">
            <button
              className={`favorite-btn ${favorite ? "active" : ""}`}
              onClick={onFavoriteClick}
              aria-label={
                favorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {favorite ? "♥" : "♡"}
            </button>
            {rating && <span className="movie-rating">⭐ {rating}</span>}
          </div>
        </div>
        <div className="movie-info">
          <h3>{movie.title}</h3>
          {releaseYear && <p className="release-year">{releaseYear}</p>}
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
