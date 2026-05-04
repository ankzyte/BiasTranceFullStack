import { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const storageKey = currentUser
    ? "cineverse_favorites_" + currentUser.id
    : null;

  // Initialize directly from localStorage — no useEffect needed for loading.
  // This runs synchronously on mount so favorites is never briefly [] on refresh.
  const [favorites, setFavorites] = useState(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Re-load when the user changes (login / logout / switch account)
  useEffect(() => {
    if (!storageKey) {
      setFavorites([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      setFavorites(stored ? JSON.parse(stored) : []);
    } catch {
      setFavorites([]);
    }
  }, [storageKey]);

  // Persist whenever favorites change — safe because we never start with stale [].
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(favorites));
  }, [favorites, storageKey]);

  const addToFavorites = (movie) => setFavorites((prev) => [...prev, movie]);

  const removeFromFavorites = (movieId) =>
    setFavorites((prev) => prev.filter((m) => m.id !== movieId));

  const isFavorite = (movieId) => favorites.some((m) => m.id === movieId);

  const value = { favorites, addToFavorites, removeFromFavorites, isFavorite };

  return (
    <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
  );
};
