import "../css/GenreFilter.css";
/**
 * GenreFilter
 * Props:
 *  genres        - array of { id, name } from TMDB
 *  selectedGenre - currently active genre id (or null for All)
 *  onSelect      - callback(genreId | null)
 */
const GenreFilter = ({ genres, selectedGenre, onSelect }) => {
  return (
    <div className="gf-wrapper">
      <div className="gf-track">
        {/* "All" pill */}
        <button
          className={`gf-pill ${selectedGenre === null ? "gf-pill--active" : ""}`}
          onClick={() => onSelect(null)}
        >
          All
        </button>

        {genres.map((genre) => (
          <button
            key={genre.id}
            className={`gf-pill ${selectedGenre === genre.id ? "gf-pill--active" : ""}`}
            onClick={() => onSelect(genre.id)}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreFilter;
