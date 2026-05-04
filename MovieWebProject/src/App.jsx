import "./css/App.css";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BiasAnalyzer from "./pages/BiasAnalyzer";
import AnalysisHistory from "./pages/AnalysisHistory";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MovieProvider } from "./contexts/MovieContext";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <MovieProvider>
        <NavBar />
        <main className="main-content">
          <Routes>
            {/* ── Movie browsing ───────────────────────────────────── */}
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />

            {/* ── Auth ─────────────────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ── Favorites (protected) ────────────────────────────── */}
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />

            {/* ── AI Bias tools ─────────────────────────────────────── */}
            <Route path="/analyze" element={<BiasAnalyzer />} />
            <Route path="/analysis-history" element={<AnalysisHistory />} />
          </Routes>
        </main>
      </MovieProvider>
    </AuthProvider>
  );
}

export default App;