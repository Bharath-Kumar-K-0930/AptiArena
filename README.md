# AptiArena - AI-Powered Competitive Quiz Platform 🧠

AptiArena is a next-generation quiz platform designed to revolutionize how students and professionals prepare for competitive exams. It combines **Generative AI** for instant content creation, **Socket.io** for real-time multiplayer hosting, and **Deep Analytics** for performance tracking.

## 🚀 Key Features

### 🤖 AI Quiz Generation
- **Instant Creation**: Generate quizzes from any Topic, PDF, DOCX, or Text using Gemini 1.5 Flash.
- **Smart Parsing**: Automatically extracts questions from existing documents.
- **Dynamic Fallback**: Includes specialized question banks for "Problems on Ages", "Number Series", and "Blood Relations" if AI is unavailable.

### 🎤 Live Hosting (Multiplayer)
- **Real-Time Lobby**: Host live quizzes with 1000+ participants via WebSocket.
- **Live Leaderboard**: See scores update instantly after every question.
- **Interactive**: Cheer messages and animations ("Confetti") for top performers.

### 📊 Deep Analytics
- **Performance Tracking**: Detailed dashboard showing accuracy, speed, and weak areas.
- **History**: Access past quiz results and retry mechanism.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js, Socket.io (Real-time engine).
- **Database**: MongoDB (Atlas) with Mongoose ODM.
- **AI Engine**: Google Gemini API (1.5 Flash / Pro).
- **Authentication**: Custom JWT Auth.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Connection String
- Gemini API Key

### 1. Clone Repository
```bash
git clone https://github.com/Bharath-Kumar-K-0930/AptiArena.git
cd AptiArena
```

### 2. Backend Setup
```bash
cd server
npm install
# Create .env file with:
# PORT=5000
# MONGO_URI=your_mongo_url
# JWT_SECRET=your_secret
# GEMINI_API_KEY=your_gemini_key

npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
# Default connects to localhost:5000
npm run dev
```

Visit `[http://localhost:3000]` <a href="https://apti-arena.vercel.app/"> Hosted <b>AptiArena Vercel App</b> </a> to start quizzing!

## 🤝 Contribution
Feel free to fork and submit PRs.

## 📄 License
MIT License
