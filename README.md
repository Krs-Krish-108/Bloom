# 🪷 Bloom L00M (MERN + Socket.IO + Gemini AI)

A modern, full-stack social platform built with the **MERN stack** (MongoDB, Express, React, Node.js), featuring **Socket.IO real-time capabilities**, responsive mobile-first UI, and **Google Gemini AI image cartoonification**.

---

## ✨ Features

- **🔐 Robust Authentication**: User registration and login using JWT stored in secure HTTP-only cookies.
- **📱 Responsive Mobile Experience**:
  - Desktop: Left sidebar navigation with collapsible labels and live badges.
  - Mobile: Native top navigation bar, bottom tab bar, swipe-ready comments bottom sheet, and full-screen mobile chat.
- **💬 Real-Time Messaging**: 1-on-1 direct messaging powered by Socket.IO with live online/offline green status indicators and instantaneous conversation updates.
- **🔔 Live Notifications**: Real-time push notifications for post likes, comments, and interactions with badge counters and toast notifications.
- **🎨 Gemini AI Cartoon & Anime Styling**:
  - Transform uploaded pictures into Ghibli, Anime, or Disney/Pixar cartoon art styles using Google Gemini 2.5 multimodal image generation.
  - Admin toggle to preview original photo vs AI stylized render.
- **📖 Stories & Status**: Interactive story viewer with progress bars and automatic slide advances.
- **🖼️ Feed & Explore Gallery**:
  - Dynamic feed with infinite scroll, double-tap like animations, comment dialogs, and bookmarking.
  - High-resolution 3-column explore/gallery grid with detailed modal inspection.
- **👤 Profile Management**: User bio, gender, avatar uploads via Cloudinary, follower/following counts, and post tabs (Posts, Saved).
- **🚀 Production Ready**: Configured for continuous deployment on **Render** (backend) and **Vercel** (frontend).

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with **Vite**
- **Tailwind CSS v4** & **Shadcn UI** components
- **Redux Toolkit** & **Redux Persist** (Client state management)
- **Socket.IO Client** (Real-time events)
- **Lucide Icons** & **Sonner** (Toast notifications)

### Backend
- **Node.js** & **Express 5**
- **MongoDB Atlas** with **Mongoose**
- **Socket.IO** (WebSockets)
- **Cloudinary** (Media and asset storage)
- **Google Gemini API** (`@google/genai`) for AI image transformations
- **DataURI & Multer** for memory-buffered image uploads

---

## 📁 Project Structure

```
├── backend/
│   ├── controllers/      # User, Post, and Message route handlers
│   ├── models/           # Mongoose schemas (User, Post, Comment, Conversation, Message)
│   ├── routes/           # Express API routers
│   ├── socket/           # Socket.io connection logic & online user tracker
│   ├── utils/            # Cloudinary, Gemini AI, and database connection helpers
│   ├── server.js         # Backend entry point
│   └── .env.example      # Backend environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components (Feed, Sidebar, ChatPage, Profile, etc.)
│   │   ├── hooks/        # Custom React hooks (RTM, GetAllPost, GetUserProfile)
│   │   ├── redux/        # Redux slices (auth, post, chat, socket, rtn)
│   │   └── utils/        # Axios API config and constant endpoints
│   ├── vercel.json       # Vercel SPA routing configuration
│   └── .env.example      # Frontend environment variables template
├── package.json          # Root orchestration scripts
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database account
- [Cloudinary](https://cloudinary.com/) account
- [Google AI Studio](https://aistudio.google.com/) API Key

### 1. Clone the repository
```bash
git clone <repository-url>
cd "Instagram clone"
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` by copying `.env.example`:
```env
PORT=8000
MONGO_URI=your_mongodb_connection_uri
SECRET_KEY=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
ADMIN_SECRET_KEY=your_admin_secret_key
URL=http://localhost:5173
```
Run backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment

### Backend (Render.com)
1. Create a new **Web Service** on Render connected to this repository.
2. Set **Root Directory** to `backend` (or use root build commands):
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. In **Environment Variables**, provide all values listed in `backend/.env.example`.

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_BACKEND_URL`: Your live Render service URL (e.g., `https://your-backend.onrender.com`).
4. Deploy! `vercel.json` will automatically handle SPA client routing.

---

## 🧪 Testing

The repository contains an end-to-end API test suite:
```bash
cd backend
node test_api_suite.js
```
Runs 23 automated end-to-end tests validating user registration, auth tokens, duplicate checks, post likes/comments, bookmarks, message boundaries, and cleanup routines.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
