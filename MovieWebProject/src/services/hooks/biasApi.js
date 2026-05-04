/**
 * biasApi.js
 * Handles all communication with the Flask bias-detection backend.
 * Base URL points to the Flask dev server; update for production.
 */

const BIAS_API = import.meta.env.VITE_BIAS_API_URL || "http://localhost:5000";

/**
 * Analyze a piece of text for bias, emotion, and explanation.
 *
 * @param {string} text - The review or article text to analyze
 * @returns {Promise<{
 *   prediction: string,
 *   confidence: number,
 *   emotion: string,
 *   emotion_score: number,
 *   explanation: string[]
 * }>}
 */
export async function analyzeText(text) {
  const res = await fetch(`${BIAS_API}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  return res.json();
}
export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("http://127.0.0.1:5000/analyze", {
    method: "POST",
    body: formData
  });

  return response.json();
}
/**
 * Fetch the full analysis history from the backend.
 *
 * @returns {Promise<Array<{id, text, prediction, confidence}>>}
 */
export async function fetchHistory() {
  const res = await fetch(`${BIAS_API}/history`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
  return res.json();
}

/**
 * Delete a history entry by id.
 *
 * @param {number} id
 */
export async function deleteHistoryEntry(id) {
  const res = await fetch(`${BIAS_API}/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete entry: ${res.status}`);
  return res.json();
}