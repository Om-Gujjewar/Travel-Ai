# ✈️ TravelAI – AI-Powered Travel Planner

TravelAI is an AI-powered travel planning application that helps users create personalized travel itineraries based on their destination, budget, travel duration, preferences, and other requirements.

Powered by Large Language Models (LLMs), TravelAI generates customized travel plans with recommendations for attractions, accommodation, food, and transportation.

## ✨ Features

- 🤖 AI-powered travel planning
- 🗺️ Personalized travel itineraries
- 💰 Budget-based travel recommendations
- 🏨 Accommodation recommendations
- 🍽️ Food and restaurant recommendations
- 🚗 Transportation recommendations
- 📍 Destination-based suggestions
- ⚡ Real-time AI response generation through Groq API
- 🛡️ Backend error handling and input validation

## 🛠️ Tech Stack

**Frontend**
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

**Backend**
- Python
- FastAPI
- Pydantic

**AI Integration**
- Groq API
- Large Language Models (LLMs)
- Prompt Engineering

## 📁 Project Structure

```text
TravelAI/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .gitignore
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/TravelAI.git
cd TravelAI
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend folder:

```env
GROQ_API_KEY=your_groq_api_key
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend API:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open another terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local frontend URL provided by Vite, usually:

`http://localhost:5173`

## 🔐 Environment Variables

The backend requires a Groq API key.

| Variable | Description |
|---|---|
| GROQ_API_KEY | API key for Groq LLM integration |

Never commit your actual API keys or `.env` files to GitHub.

## 🧠 How It Works

1. The user enters their travel requirements.
2. The React frontend sends the information to the FastAPI backend.
3. The backend processes and validates the request.
4. The Groq LLM generates personalized travel recommendations.
5. The frontend displays the generated travel itinerary.

## 🚀 Deployment

Currently, TravelAI runs locally.

Cloud deployment will be added in a future update.

## 👨‍💻 Author

**Om Gujjewar**

B.Tech Student | Aspiring AI Engineer

Interested in Artificial Intelligence, Machine Learning, Deep Learning, and Generative AI.

---

⭐ If you find this project interesting, consider giving it a star!