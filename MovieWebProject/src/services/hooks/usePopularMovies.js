import { useState, useCallback } from "react";

const API_KEY  = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

/**
 * usePopularMovies
 * Manages fetching + accumulating popular movies across pages.
 *
 * Returns:
 *  movies      - accumulated list across all loaded pages
 *  loading     - true while a fetch is in-flight
 *  hasMore     - false when TMDB says no more pages exist
 *  loadMore    - call this to fetch the next page
 *  error       - error message if fetch failed
 */
const usePopularMovies = () => {
  const [movies,  setMovies]  = useState([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error,   setError]   = useState(null);

  const loadMore = useCallback(async () => {
    // Guard: don't fire duplicate requests
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const res  = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.status_message ?? "Failed to fetch");

      setMovies((prev) => {
        // Deduplicate by id (safety net for StrictMode double-invoke)
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = data.results.filter((m) => !existingIds.has(m.id));
        return [...prev, ...fresh];
      });

      // TMDB gives us total_pages — stop when we've hit the ceiling
      setHasMore(page < data.total_pages);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return { movies, loading, hasMore, loadMore, error };
};

export default usePopularMovies;