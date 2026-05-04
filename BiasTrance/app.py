from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import requests
import os
from database import db
from models import Review
from explainer import generate_explanation
from dotenv import load_dotenv
load_dotenv()
try:
    from PIL import Image
    import pytesseract
    # Windows users: set Tesseract path here if needed
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
app = Flask(__name__)
CORS(app)  # Allow React frontend to call this API

# ── Database ──────────────────────────────────────────────────────────────────
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bias_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
db.init_app(app)

with app.app_context():
    db.create_all()

# ── Load ML Model & Vectorizer ────────────────────────────────────────────────
with open("data/bias_detection_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("data/tfidf_vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)

# ── Hugging Face Emotion API ──────────────────────────────────────────────────
HF_API_URL = "https://router.huggingface.co/hf-inference/models/SamLowe/roberta-base-go_emotions"

API_KEY = os.getenv("HF_TOKEN")
HF_HEADERS = {
    "Authorization": f"Bearer {API_KEY}"
}

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Bias Detection API is running"})

with open("data/bias_detection_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("data/tfidf_vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    """Return True if the file extension is in the allowed set."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
def extract_text_from_image(image_file):
    """
    Run Tesseract OCR on an uploaded image file object.
    Returns (extracted_text, error_message).
    On success error_message is None; on failure extracted_text is "".
    """
    if not OCR_AVAILABLE:
        return "", "OCR libraries (Pillow / pytesseract) are not installed."
 
    try:
        image = Image.open(image_file)
 
        # Convert to RGB so Tesseract handles all common formats
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
 
        text = pytesseract.image_to_string(image).strip()
 
        if not text:
            return "", "No text could be extracted from the image. Please upload a clearer image."
 
        return text, None
 
    except pytesseract.TesseractNotFoundError:
        return "", (
            "Tesseract is not installed or not found. "
            "Install it from https://github.com/UB-Mannheim/tesseract/wiki and "
            "set the path in app.py."
        )
    except Exception as e:
        return "", f"Image processing error: {str(e)}"
@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze a piece of text for bias, emotion, and generate an explanation.

    Request body:
        { "text": "some movie review text..." }

    Response:
        {
            "prediction": "Biased" | "Neutral",
            "confidence": 92.5,
            "emotion": "anger",
            "emotion_score": 87.3,
            "explanation": ["reason 1", "reason 2", ...]
        }
    """
    text = ""

    # ✅ IMAGE INPUT
    if 'image' in request.files:
        file = request.files['image']

        if file and allowed_file(file.filename):
            text, err = extract_text_from_image(file)

            if err:
                return jsonify({"error": err}), 400
        else:
            return jsonify({"error": "Invalid image file"}), 400

    # ✅ TEXT INPUT
    else:
        data = request.get_json(silent=True)

        if not data or not data.get("text", "").strip():
            return jsonify({"error": "No input provided"}), 400

        text = data["text"].strip()

    # ── Bias Detection ────────────────────────────────────────────────────────
    text_tfidf = tfidf.transform([text])
    pred = model.predict(text_tfidf)[0]
    prob = model.predict_proba(text_tfidf)[0]

    prediction = "Biased" if pred == 1 else "Neutral"
    confidence = round(float(max(prob)) * 100, 2)

    # ── Emotion Detection ─────────────────────────────────────────────────────
    emotion, emotion_score = detect_emotion(text)

    # ── Explanation ───────────────────────────────────────────────────────────
    explanation = generate_explanation(
        text       = text,
        emotion    = emotion,
        prediction = prediction,
        confidence = confidence,
    )

    # ── Persist to DB ─────────────────────────────────────────────────────────
    review = Review(text=text, prediction=prediction, confidence=confidence)
    db.session.add(review)
    db.session.commit()

    return jsonify({
        "id": review.id,
        "text": text,
        "prediction": prediction,
        "confidence": confidence,
        "emotion": emotion,
        "emotion_score": emotion_score,
        "explanation": explanation
    })


@app.route("/history", methods=["GET"])
def history():
    """Return all past analyses ordered by newest first."""
    reviews = Review.query.order_by(Review.id.desc()).all()
    return jsonify([
        {
            "id": r.id,
            "text": r.text,
            "prediction": r.prediction,
            "confidence": r.confidence
        }
        for r in reviews
    ])


@app.route("/history/<int:review_id>", methods=["DELETE"])
def delete_review(review_id):
    """Delete a specific analysis record."""
    review = Review.query.get_or_404(review_id)
    db.session.delete(review)
    db.session.commit()
    return jsonify({"deleted": review_id})


# ── Helper Functions ──────────────────────────────────────────────────────────

def detect_emotion(text):
    """Call HuggingFace GoEmotions API; fallback gracefully on failure."""
    try:
        response = requests.post(
            HF_API_URL,
            headers=HF_HEADERS,
            json={"inputs": text},
            timeout=10
        )
        result = response.json()

        if isinstance(result, dict) and "error" in result:
            return "unknown", 0.0

        emotion = result[0][0]["label"]
        score = round(result[0][0]["score"] * 100, 2)
        return emotion, score

    except Exception:
        return "unknown", 0.0


def explain_bias(text, emotion):
    """
    Rule-based explainable AI: identify bias signals in the text.
    Returns a list of human-readable reason strings.
    """
    text_lower = text.lower()
    reasons = []

    # Strong opinion words
    opinion_words = [
        "overrated", "underrated", "terrible", "amazing", "worst",
        "best", "awful", "excellent", "biased", "disappointing",
        "fantastic", "garbage", "masterpiece", "atrocious", "brilliant",
        "unwatchable", "flawless", "mediocre", "breathtaking", "dreadful"
    ]
    found = [w for w in opinion_words if w in text_lower]
    if found:
        reasons.append(
            f"Strong opinion words detected: {', '.join(found)}. "
            "These signal subjective judgment rather than objective fact."
        )

    # Emotional tone from the model
    non_neutral_emotions = {
        "anger", "disgust", "fear", "sadness", "disappointment",
        "annoyance", "joy", "excitement", "admiration", "amusement"
    }
    if emotion.lower() in non_neutral_emotions:
        reasons.append(
            f"Emotional tone detected: '{emotion}'. "
            "Emotional language can skew objectivity in reviews."
        )

    # Generalizing language
    generalizing_phrases = [
        "always", "never", "everyone", "nobody", "all movies",
        "every film", "no one", "every actor", "all critics"
    ]
    found_general = [p for p in generalizing_phrases if p in text_lower]
    if found_general:
        reasons.append(
            f"Sweeping generalizations found: {', '.join(found_general)}. "
            "These broad claims often indicate bias."
        )

    # Subjective phrases
    subjective_phrases = [
        "i think", "i believe", "in my opinion", "i feel",
        "personally", "to me", "i reckon", "i suspect"
    ]
    found_subjective = [p for p in subjective_phrases if p in text_lower]
    if found_subjective:
        reasons.append(
            f"Subjective framing detected: '{found_subjective[0]}'. "
            "Personal opinion markers reduce factual credibility."
        )

    # Hyperbolic language
    hyperbole = [
        "literally", "absolutely", "completely", "totally", "utterly",
        "incredibly", "insanely", "ridiculously"
    ]
    found_hyp = [h for h in hyperbole if h in text_lower]
    if len(found_hyp) >= 2:
        reasons.append(
            f"Hyperbolic intensifiers found ({', '.join(found_hyp)}). "
            "Excessive amplification is a common bias marker."
        )

    # Default — neutral
    if not reasons:
        reasons.append(
            "No strong bias indicators detected. "
            "The text appears balanced and factual."
        )

    return reasons


if __name__ == "__main__":
    app.run(debug=True, port=5000)