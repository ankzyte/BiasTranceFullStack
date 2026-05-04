import { useState, useEffect, useCallback, useRef } from "react";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import GenreFilter from "../components/GenreFilter";
import useInfiniteScroll from "../services/hooks/useInfiniteScroll";
import { searchMovies } from "../services/hooks/api";
import "../css/Home.css";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// ── api helpers ───────────────────────────────────────────────────────────────
const fetchPopular = (page) =>
  fetch(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
  ).then((r) => r.json());

const fetchByGenre = (genreId, page) =>
  fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`,
  ).then((r) => r.json());

const fetchGenres = () =>
  fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`).then(
    (r) => r.json(),
  );

// ── component ─────────────────────────────────────────────────────────────────
const Home = () => {
  // ── genre state ───────────────────────────────────────
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null); // null = All

  // ── movies state ──────────────────────────────────────
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // ── search state ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // prevent duplicate in-flight fetches
  const fetchingRef = useRef(false);

  // ── fetch genres once on mount ────────────────────────
  useEffect(() => {
    fetchGenres()
      .then((data) => setGenres(data.genres ?? []))
      .catch(() => {});
  }, []);

  // ── reset + reload when genre changes ────────────────
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    fetchingRef.current = false;
  }, [selectedGenre]);

  // ── load more movies (popular or by genre) ────────────
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = selectedGenre
        ? await fetchByGenre(selectedGenre, page)
        : await fetchPopular(page);

      setMovies((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = (data.results ?? []).filter(
          (m) => !existingIds.has(m.id),
        );
        return [...prev, ...fresh];
      });

      setHasMore(page < (data.total_pages ?? 1));
      setPage((p) => p + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [page, hasMore, selectedGenre]);

  // load first page whenever movies resets to []
  useEffect(() => {
    if (movies.length === 0 && hasMore && !isSearching) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies]);

  // ── infinite scroll sentinel ──────────────────────────
  const handleSentinel = useCallback(() => {
    if (!isSearching) loadMore();
  }, [isSearching, loadMore]);

  const sentinelRef = useInfiniteScroll(
    handleSentinel,
    !isSearching && hasMore && !loading,
  );

  // ── genre select handler ──────────────────────────────
  const handleGenreSelect = (genreId) => {
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery("");
      setSearchResults([]);
    }
    setSelectedGenre(genreId);
  };

  // ── shared search executor ────────────────────────────
  const runSearch = async (q) => {
    setIsSearching(true);
    setSearchLoading(true);
    try {
      const { results } = await searchMovies(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── debounced live search ─────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      if (isSearching) handleClearSearch();
      return;
    }
    setIsSearching(true);
    setSearchLoading(true);
    const timer = setTimeout(() => runSearch(q), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ── search handlers ───────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      handleClearSearch();
      return;
    }
    runSearch(q);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // ── derived ───────────────────────────────────────────
  const displayMovies = isSearching ? searchResults : movies;
  const showEmpty = isSearching && !searchLoading && searchResults.length === 0;
  const activeGenreName = genres.find((g) => g.id === selectedGenre)?.name;

  // ── render ────────────────────────────────────────────
  return (
    <div className="home-page">
      {/* Search bar */}
      <section className="home-search">
        <form onSubmit={handleSearch} className="home-search__form">
          <input
            type="text"
            placeholder="Search for a movie…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="home-search__input"
          />
          <button type="submit" className="home-search__btn">
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              className="home-search__clear"
              onClick={handleClearSearch}
            >
              ✕ Clear
            </button>
          )}
        </form>
      </section>

      {/* Genre filter pills — hidden during search */}
      {!isSearching && (
        <GenreFilter
          genres={genres}
          selectedGenre={selectedGenre}
          onSelect={handleGenreSelect}
        />
      )}

      {/* Section heading */}
      <h2 className="home-heading">
        {isSearching
          ? `Results for "${searchQuery}"`
          : selectedGenre
            ? `${activeGenreName} Movies`
            : "Popular Movies"}
      </h2>

      {/* Error */}
      {error && <p className="home-error">Failed to load: {error}</p>}

      {/* Empty search */}
      {showEmpty && (
        <p className="home-empty">No results for "{searchQuery}"</p>
      )}

      {/* Movie grid */}
      {displayMovies.length > 0 && (
        <div className="home-grid">
          {displayMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {/* Sentinel + spinner — popular/genre only */}
      {!isSearching && (
        <LoadingSpinner
          sentinelRef={sentinelRef}
          loading={loading}
          hasMore={hasMore}
        />
      )}

      {/* Search loading */}
      {isSearching && searchLoading && (
        <LoadingSpinner sentinelRef={null} loading={true} hasMore={true} />
      )}
    </div>
  );
};

export default Home;
