import { useState, useEffect } from "react";
import { fetchHistory, deleteHistoryEntry } from "../services/hooks/biasApi";
import "../css/AnalysisHistory.css";

/**
 * AnalysisHistory page
 * Fetches and displays the full analysis history stored in the Flask SQLite DB.
 * Accessible at /analysis-history in the React router.
 */
const AnalysisHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null); // id being deleted

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchHistory();
        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteHistoryEntry(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // ── derived stats ──────────────────────────────────────────────────────────
  const biasedCount = records.filter((r) => r.prediction === "Biased").length;
  const neutralCount = records.filter((r) => r.prediction === "Neutral").length;
  const avgConf =
    records.length > 0
      ? (records.reduce((s, r) => s + (r.confidence || 0), 0) / records.length).toFixed(1)
      : "—";

  return (
    <div className="ah-page">
      {/* Hero */}
      <div className="ah-hero">
        <div className="ah-hero__eyebrow">Activity Log</div>
        <h1 className="ah-hero__title">
          Analysis <span>History</span>
        </h1>
        <p className="ah-hero__sub">
          All text analyses stored by the AI backend — persisted in SQLite.
        </p>
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div className="ah-stats">
          <div className="ah-stat">
            <span className="ah-stat__num">{records.length}</span>
            <span className="ah-stat__label">Total</span>
          </div>
          <div className="ah-stat ah-stat--biased">
            <span className="ah-stat__num">{biasedCount}</span>
            <span className="ah-stat__label">Biased</span>
          </div>
          <div className="ah-stat ah-stat--neutral">
            <span className="ah-stat__num">{neutralCount}</span>
            <span className="ah-stat__label">Neutral</span>
          </div>
          <div className="ah-stat">
            <span className="ah-stat__num">{avgConf}%</span>
            <span className="ah-stat__label">Avg Conf.</span>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="ah-card">
        {loading && (
          <div className="ah-state">
            <span className="ah-spinner" /> Loading history…
          </div>
        )}

        {error && (
          <div className="ah-state ah-state--error">
            ⚠ Failed to load: {error}
            <br />
            <small>Make sure the Flask backend is running on port 5000.</small>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="ah-state ah-state--empty">
            No analyses yet. Head to{" "}
            <a href="/analyze">Bias Analyzer</a> or open a movie's reviews to get started.
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="ah-table-wrap">
            <table className="ah-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Text Snippet</th>
                  <th>Result</th>
                  <th>Confidence</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="ah-cell-id">#{r.id}</td>
                    <td className="ah-cell-text" title={r.text}>
                      {r.text.length > 80 ? r.text.slice(0, 80) + "…" : r.text}
                    </td>
                    <td>
                      <span
                        className={`ah-badge ${
                          r.prediction === "Biased" ? "ah-badge--biased" : "ah-badge--neutral"
                        }`}
                      >
                        {r.prediction}
                      </span>
                    </td>
                    <td className="ah-cell-conf">{r.confidence}%</td>
                    <td>
                      <button
                        className="ah-delete-btn"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        aria-label="Delete record"
                      >
                        {deleting === r.id ? "…" : "✕"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;