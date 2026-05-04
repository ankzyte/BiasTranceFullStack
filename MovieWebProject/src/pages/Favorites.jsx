import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/Favorites.css";

function Favorites() {
  const { currentUser } = useAuth();
  const { favorites } = useMovieContext();

  if (!currentUser) {
    return (
      <div className="favorites-empty">
        <h2>Sign in to see your favorites</h2>
        <p>Create an account to save movies to your personal watchlist.</p>
        <Link to="/login" className="favorites-cta">
          Sign In
        </Link>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <h2>No favorites yet</h2>
        <p>Start adding movies to your favorites and they will appear here.</p>
        <Link to="/" className="favorites-cta">
          Browse Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="favorites">
      <div className="favorites-header">
        <h2>Your Favorites</h2>
        <span className="favorites-count">
          {favorites.length} movie{favorites.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="movies-grid">
        {favorites.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  );
}

export default Favorites;
