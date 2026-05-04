import "../css/BiasResult.css";

/**
 * BiasResult
 * Displays the structured output from the Flask /analyze endpoint.
 *
 * Props:
 *  result  - { prediction, confidence, emotion, emotion_score, explanation[] }
 *  onClose - optional callback to dismiss/reset the result
 */
const BiasResult = ({ result, onClose }) => {
  if (!result) return null;

  const isBiased = result.prediction === "Biased";

  return (
    <div className={`bias-result ${isBiased ? "bias-result--biased" : "bias-result--neutral"}`}>
      {/* Header row */}
      <div className="bias-result__header">
        <div className="bias-result__badges">
          {/* Verdict badge */}
          <span className={`bias-badge ${isBiased ? "bias-badge--biased" : "bias-badge--neutral"}`}>
            {isBiased ? "⚠ Biased" : "✓ Neutral"}
          </span>

          {/* Confidence pill */}
          <span className="bias-badge bias-badge--conf">
            {result.confidence}% confidence
          </span>

          {/* Emotion pill */}
          {result.emotion && result.emotion !== "unknown" && (
            <span className="bias-badge bias-badge--emotion">
              {result.emotion}
              {result.emotion_score > 0 && ` · ${result.emotion_score}%`}
            </span>
          )}
        </div>

        {onClose && (
          <button className="bias-result__close" onClick={onClose} aria-label="Dismiss analysis">
            ✕
          </button>
        )}
      </div>

      {/* Confidence bar */}
      <div className="bias-conf-bar" aria-label={`Confidence: ${result.confidence}%`}>
        <div
          className={`bias-conf-bar__fill ${isBiased ? "bias-conf-bar__fill--biased" : "bias-conf-bar__fill--neutral"}`}
          style={{ width: `${result.confidence}%` }}
        />
      </div>

      {/* Explanation list */}
      {result.explanation && result.explanation.length > 0 && (
        <ul className="bias-explanation">
          {result.explanation.map((reason, i) => (
            <li key={i} className="bias-explanation__item">
              <span className="bias-explanation__bullet">›</span>
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BiasResult;