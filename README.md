# BiasTrance – AI-Based Bias Detection System for Movie Reviews & Media Articles

## 📌 Overview

BiasTrance is a full-stack AI-powered web application that analyzes movie reviews and entertainment media content to detect:

- Bias (Biased / Neutral)
- Emotional tone
- Subjective language
- Opinionated phrasing

The system also supports **OCR (Optical Character Recognition)**, allowing users to upload screenshots/images containing reviews and analyze them directly.

---

# 🚀 Features

## 🎬 Movie Platform
- Browse movies
- Search movies
- View movie details and reviews

## 🤖 AI Analysis
- Bias Detection
- Emotion Detection
- Explainable AI (Bias Explanation)
- Confidence Score

## 🖼 OCR Support
- Upload screenshots/images
- Extract text using Tesseract OCR
- Analyze extracted text automatically

## 🗂 Database
- Stores analysis history using SQLite

---

# 🛠 Tech Stack

## Frontend
- React
- Vite
- CSS

## Backend
- Flask
- Flask-CORS
- Flask-SQLAlchemy

## Machine Learning / NLP
- Scikit-learn
- TF-IDF Vectorizer
- Logistic Regression
- Hugging Face API

## OCR
- Tesseract OCR
- pytesseract
- Pillow

## Database
- SQLite

---


# ⚙️ Prerequisites

Install the following before running the project:

- Python 3.10+
- Node.js
- npm
- Git
- Tesseract OCR

---

# 🔧 Step-by-Step Installation

# 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/BiasTrance.git
cd BiasTranceFullStack
```

---

# 2️⃣ Setup Backend (Flask)

## Go to backend folder

```bash
cd BiasTrance
```

---

## Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Mac/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

# 3️⃣ Install Tesseract OCR

## Windows

Download and install:

https://github.com/UB-Mannheim/tesseract/wiki

Default installation path:

```text
C:\Program Files\Tesseract-OCR\tesseract.exe
```

In `app.py` add:

```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

---

## Linux

```bash
sudo apt install tesseract-ocr
```

---

## Mac

```bash
brew install tesseract
```

---

# 4️⃣ Setup Hugging Face API

Create a `.env` file in backend folder:

```env
HF_API_KEY=your_huggingface_api_key
```

Generate token from:

https://huggingface.co/settings/tokens

---

# 5️⃣ Run Flask Backend

```bash
python app.py
```

Backend will run on:

```text
http://127.0.0.1:5000
```

---

# 6️⃣ Setup Frontend (React)

Open a new terminal.

## Go to frontend folder

```bash
cd MovieWebProject
```

---

## Install Node Modules

```bash
npm install
```

---

# 7️⃣ Configure Frontend Environment

Create `.env` file inside frontend folder:

```env
VITE_BIAS_API_URL=http://127.0.0.1:5000
VITE_API_KEY=your_tmdb_api_key
```

Get TMDB API key from:

https://www.themoviedb.org/settings/api

---

# 8️⃣ Run React Frontend

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

# 🛡 Common Issues

## Flask CORS Error

Install:

```bash
pip install flask-cors
```

Enable:

```python
from flask_cors import CORS
CORS(app)
```

---

## Tesseract Not Found

Ensure:

```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

is correctly set.

---

## Node Modules Missing

Run:

```bash
npm install
```

---

