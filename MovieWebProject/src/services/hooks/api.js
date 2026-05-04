const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const PAGE_SIZE = 18; // 6 rows × 3 columns

// ─── Popular Movies ───────────────────────────────────────────────────────────
export const getPopularMovies = async (page = 1) => {
  const res = await fetch(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`
  );
  const data = await res.json();
  return { results: data.results.slice(0, PAGE_SIZE), totalPages: data.total_pages };
};

// ─── Search Movies ────────────────────────────────────────────────────────────
export const searchMovies = async (query, page = 1) => {
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );
  const data = await res.json();
  return { results: data.results.slice(0, PAGE_SIZE), totalPages: data.total_pages };
};

// ─── Movie Details ────────────────────────────────────────────────────────────
export const getMovieDetails = async (id) => {
  const res = await fetch(
    `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,videos`
  );
  if (!res.ok) throw new Error("Movie not found");
  return res.json();
};

// ─── Genre List ───────────────────────────────────────────────────────────────
export const getGenres = async () => {
  const res = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
  );
  const data = await res.json();
  return data.genres;
};

// ─── Movies by Genre ──────────────────────────────────────────────────────────
export const getMoviesByGenre = async (genreId, page = 1) => {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`
  );
  const data = await res.json();
  return { results: data.results.slice(0, PAGE_SIZE), totalPages: data.total_pages };
};
