import { useState } from "react";
import { analyzeText } from "../services/hooks/biasApi";
import BiasResult from "../components/BiasResult";
import "../css/BiasAnalyzer.css";

/**
 * BiasAnalyzer page
 * Lets users paste any film-related text and run the full analysis pipeline.
 * Accessible at /analyze in the React router.
 */
const BiasAnalyzer = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const charCount = text.length;
  const MIN_CHARS = 20;
  const canAnalyze = charCount >= MIN_CHARS && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAnalyze) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await analyzeText(text);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError(null);
  };
  const handleImageUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);

    try {
        const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData
        });

        const data = await response.json();

        console.log("API RESPONSE:", data);

        // ❗ HANDLE BACKEND ERROR
        if (data.error) {
        alert(data.error);
        setLoading(false);
        console.log("hellow1")
        return;
        }

        // ✅ SAFE DEFAULTS
        setText(data.text || "");
        console.log("hellow")
        setResult({
        ...data,
        explanation: data.explanation || []
        });

    } catch (error) {
        console.error("Upload error:", error);
    }

    setLoading(false);
    };
  return (
    <div className="ba-page">
      {/* Hero */}
      <div className="ba-hero">
        <div className="ba-hero__eyebrow">AI-Powered · NLP</div>
        <h1 className="ba-hero__title">
          Bias <span>Analyzer</span>
        </h1>
        <p className="ba-hero__sub">
          Paste any film review, critic article, or media text to instantly
          detect bias, emotion, and language patterns.
        </p>
      </div>

      {/* Stats row */}
      <div className="ba-stats">
        <div className="ba-stat">
          <span className="ba-stat__num">94%</span>
          <span className="ba-stat__label">Accuracy</span>
        </div>
        <div className="ba-stat">
          <span className="ba-stat__num">&lt;1s</span>
          <span className="ba-stat__label">Response</span>
        </div>
        <div className="ba-stat">
          <span className="ba-stat__num">5</span>
          <span className="ba-stat__label">Bias signals</span>
        </div>
      </div>

      {/* Main form card */}
      <div className="ba-card">
        <form onSubmit={handleSubmit} className="ba-form">
          <label className="ba-label" htmlFor="ba-text">
            Film-related text
          </label>

          <div className="ba-textarea-wrap">
            <textarea
              id="ba-text"
              className="ba-textarea"
              placeholder="Paste a movie review, article excerpt, or any film-related content here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              disabled={loading}
            />
            <span className={`ba-charcount ${charCount < MIN_CHARS ? "ba-charcount--warn" : ""}`}>
              {charCount} chars {charCount < MIN_CHARS ? `(min ${MIN_CHARS})` : ""}
            </span>
            
          </div>

          <div className="ba-actions">
            <button
              type="submit"
              className="ba-btn ba-btn--primary"
              disabled={!canAnalyze}
            >
              {loading ? (
                <>
                  <span className="ba-btn__spinner" />
                  Analyzing…
                </>
              ) : (
                "⚡ Analyze Bias"
              )}
            </button>

            {(text || result) && (
              <button
                type="button"
                className="ba-btn ba-btn--ghost"
                onClick={handleClear}
              >
                Clear
              </button>
            )}

            <label className="ba-upload-btn">
            📷 Upload Image
            <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleImageUpload(e.target.files[0])}
            />
            </label>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="ba-error">
            ⚠ {error}. Make sure the Flask backend is running on port 5000.
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="ba-result-wrap">
            <BiasResult result={result} />
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="ba-how">
        <h2 className="ba-how__title">How it works</h2>
        <div className="ba-how__steps">
          <div className="ba-step">
            <span className="ba-step__num">01</span>
            <h3>Text Preprocessing</h3>
            <p>HTML tags, stopwords, and punctuation are removed. Text is lemmatized for cleaner input.</p>
          </div>
          <div className="ba-step">
            <span className="ba-step__num">02</span>
            <h3>TF-IDF + ML Model</h3>
            <p>A Logistic Regression model trained on 874 labeled reviews predicts Biased or Neutral.</p>
          </div>
          <div className="ba-step">
            <span className="ba-step__num">03</span>
            <h3>Emotion Detection</h3>
            <p>RoBERTa-based GoEmotions model detects the dominant emotion in the text.</p>
          </div>
          <div className="ba-step">
            <span className="ba-step__num">04</span>
            <h3>Explainability</h3>
            <p>Rule-based analysis identifies opinion words, generalizations, and subjective language.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiasAnalyzer;