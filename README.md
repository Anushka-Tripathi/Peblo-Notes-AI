# ✦ Peblo Notes

An AI-powered note-taking app built with **React**, **Node.js**, **SQLite (sql.js)**, and **Google Gemini API**.

---

## Features

### Core
- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Notes CRUD** — Create, read, update, delete notes with auto-save (1s debounce)
- **Rich Metadata** — Title, content (Markdown), tags, category, timestamps
- **Search & Filter** — Full-text search, filter by tag/category/sort order
- **Archive** — Archive/restore notes, separate archived view
- **Public Sharing** — Generate shareable public links for any note

### AI (Google Gemini)
- **AI Summary** — One-click note summarization
- **Action Items** — Automatically extract action items from notes
- **Title Suggestion** — AI suggests a better title; apply with one click
- **Usage Tracking** — Dashboard shows total AI generations and tokens used

### Dashboard
- Note count stats (total, archived, shared, AI-summarized)
- Weekly activity bar chart (Recharts)
- Top tags with frequency bars
- Recently edited notes list
- Category breakdown
- AI usage stats

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Toasts | React Hot Toast |
| Date Utils | date-fns |
| Backend | Node.js + Express |
| Database | SQLite via **sql.js** (pure JS, no native binaries) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| AI | Google Gemini 2.0 Flash API |

---

## Project Structure

```
peblo-notes/
├── backend/
│   ├── server.js              # Express entry point
│   ├── .env.example
│   └── src/
│       ├── db/
│       │   └── database.js    # sql.js SQLite setup, query helpers
│       ├── middleware/
│       │   └── auth.js        # JWT middleware + token generation
│       └── routes/
│           ├── auth.js        # POST /auth/signup, /auth/login, GET /auth/me
│           ├── notes.js       # Full notes CRUD + AI summary + share
│           ├── ai.js          # Gemini API integration
│           ├── shared.js      # Public shared note endpoint
│           └── insights.js    # Dashboard analytics
└── frontend/
    ├── src/
    │   ├── api/index.js       # Axios API client
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── auth/          # Login, Signup pages
    │   │   ├── layout/        # AppLayout (sidebar)
    │   │   ├── notes/         # NotesPage, NoteCard, NoteEditor, ArchivedPage
    │   │   ├── dashboard/     # Dashboard with charts
    │   │   └── shared/        # Public SharedNote viewer
    │   └── App.jsx            # Router + Auth wrapper
    └── .env.example
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([Get one free](https://aistudio.google.com/app/apikey))

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** — create `backend/.env`:
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user (auth required) |

### Notes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notes` | List notes (supports ?search, ?tag, ?category, ?archived, ?sort) |
| GET | `/notes/:id` | Get single note |
| POST | `/notes` | Create note |
| PATCH | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Delete note |
| POST | `/notes/:id/generate-summary` | Generate AI summary via Gemini |
| POST | `/notes/:id/share` | Toggle public sharing |

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/shared/:shareId` | View publicly shared note (no auth) |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/insights` | Dashboard data (auth required) |

---

## Database Schema

```sql
-- Users
users (id, name, email, password_hash, created_at, updated_at)

-- Notes
notes (
  id, user_id, title, content, tags (JSON),
  category, is_archived, is_public, share_id,
  ai_summary, ai_action_items (JSON), ai_suggested_title, ai_generated_at,
  created_at, updated_at
)

-- AI Usage Tracking
ai_usage (id, user_id, note_id, action, tokens_used, created_at)

-- Activity Log
activity_log (id, user_id, action, note_id, created_at)
```

---

## Design

- **Dark editorial aesthetic** — warm amber (#e8a045) and teal (#3eb8a4) accents on deep charcoal backgrounds
- **Typography** — Playfair Display (headings) + DM Sans (body) + DM Mono (code/editor)
- **Collapsible sidebar** with icons-only mode
- **Auto-save** with 1 second debounce — no save button needed
- **Responsive** layouts

---

## Evaluation Criteria Coverage

| Criteria | Implementation |
|----------|---------------|
| User Authentication | JWT + bcrypt, signup/login/protected routes |
| Notes CRUD | Full create/read/update/delete with auto-save |
| AI Integration | Gemini API — summary, action items, title suggestion |
| Search & Filter | Full-text search + tag/category/sort filters |
| Archive | Archive/restore/permanent delete |
| Public Sharing | Per-note share links with public viewer page |
| Dashboard/Insights | Stats, weekly chart, top tags, AI usage |
| AI Usage Tracking | `ai_usage` table + dashboard display |
| Clean UI | Dark editorial design, responsive, smooth UX |