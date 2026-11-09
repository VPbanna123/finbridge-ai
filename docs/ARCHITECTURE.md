# FinBridge AI — Architecture & Tech Stack

## 1. Overview

FinBridge AI is a full-stack financial inclusion web application that helps users discover government schemes, track expenses, complete a financial profile survey, and access financial literacy content. It includes JWT-based authentication with email verification via a 6-digit code.

The application is split into two independent deployable parts:

- **Backend**: Node.js + Express REST API with MongoDB Atlas
- **Frontend**: React + Vite with Zustand state management and i18next localization

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 + Vite | UI layer, fast dev server, optimized builds |
| Routing | React Router DOM | Client-side routing |
| State Management | Zustand (with persist middleware) | Auth token/user persisted in localStorage |
| HTTP Client | Axios | API requests with auth interceptors |
| Internationalization | i18next + react-i18next | EN / HI / KN localization |
| Styling | CSS Modules / global CSS | Component and global styles |
| Backend Framework | Node.js + Express 5 | REST API |
| Runtime | Node.js (ES modules, type: "module") | Server runtime |
| Database | MongoDB Atlas + Mongoose 8 | Document store, ODM |
| Authentication | JWT (jsonwebtoken) + bcryptjs | Stateless auth, password hashing |
| Validation | express-validator + Zod | Request validation (backend + frontend) |
| Email Service | Resend | Transactional email (verification codes) |
| AI / Chatbot | Google Gemini (REST API) | Finance AI chatbot with conversation memory |
| File Storage | Cloudinary | Blog images, profile photos, whiteboard exports |
| Security | Helmet, CORS | HTTP security headers, cross-origin config |
| Lint/Typecheck | `node --check` | Syntax validation |

## 3. Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│  React + Vite  │  React Router  │  Zustand  │  i18next (EN/HI/KN)   │
│  Axios client  │  CSS           │  Zod      │  localStorage         │
└──────────────┬──────────────────┴───────────┴───────────────────────┘
               │ HTTPS / REST (JSON)
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express API)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Routes      │  │ Controllers │  │ Services                    │  │
│  │ auth        │  │ auth        │  │ auth.service                │  │
│  │ user        │  │ user        │  │ email.service (Resend)      │  │
│  │ scheme      │  │ scheme      │  │ user.service                │  │
│  │ expense     │  │ expense     │  │ recommendation.service      │  │
│  │ survey      │  │ survey      │  │ survey.service              │  │
│  │ blog        │  │ blog        │  │ seed.service                │  │
│  │ dashboard   │  │ dashboard   │  │ cloudinary.service          │  │
│  │ chat        │  │ chat        │  │ chat.service (Gemini AI)    │  │
│  │ health      │  │             │  │                             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
│  Middlewares: auth (JWT), validate (express-validator), asyncHandler │
└──────────────┬──────────────────┴───────────┴───────────────────────┘
               │ Mongoose
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB Atlas)                         │
│  Collections: users, schemes, expenses, survey_responses, blogs      │
└─────────────────────────────────────────────────────────────────────┘
               │ Resend API
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EMAIL SERVICE (Resend)                            │
│  Sends 6-digit verification codes to user inboxes                    │
└─────────────────────────────────────────────────────────────────────┘
               │ Cloudinary API
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FILE STORAGE (Cloudinary)                           │
│  Profile photos, blog cover images, whiteboard exports               │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Directory Structure

```
finbridge-ai/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app setup (middleware, routes)
│   │   ├── server.js           # HTTP server entry point
│   │   ├── config/
│   │   │   ├── db.js           # MongoDB connection
│   │   │   └── env.js          # Environment variable validation
│   │   ├── controllers/        # Request handlers (auth, user, scheme, etc.)
│   │   ├── services/           # Business logic (auth.service, email.service, ...)
│   │   ├── models/             # Mongoose schemas (User, Scheme, Expense, ...)
│   │   ├── routes/             # Express route definitions
│   │   ├── middlewares/        # auth, validate, asyncHandler, ApiError, ApiResponse
│   │   ├── utils/              # Helpers (constants, logger, slug, etc.)
│   │   ├── scripts/            # Admin/scripts (makeAdmin)
│   │   ├── seed.js             # Database seeder
│   │   └── data/               # Static seed data (schemes)
│   ├── .env / .env.example     # Runtime configuration
│   ├── package.json            # Backend dependencies
│   └── test/                   # Backend tests
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component
│   │   ├── auth.jsx            # Auth wrapper (backward compat)
│   │   ├── i18n.js             # i18next config + translations (EN/HI/KN)
│   │   ├── api/
│   │   │   ├── client.js       # Axios instance with auth interceptors
│   │   │   ├── auth.api.js     # Auth API endpoints
│   │   │   └── ...             # Other feature API clients
│   │   ├── stores/
│   │   │   ├── auth.store.js   # Zustand auth store (token/user)
│   │   │   └── theme.store.js  # Theme store
│   │   ├── lib/
│   │   │   ├── schemas.js      # Zod validation schemas
│   │   │   ├── utils.js        # Utilities
│   │   │   └── markdown.jsx    # Markdown renderer
│   │   ├── config/
│   │   │   └── env.js          # Frontend env config
│   │   ├── components/
│   │   │   ├── layout/         # Layout components
│   │   │   └── ui/             # Shared UI components
│   │   ├── features/
│   │   │   ├── auth/           # AuthPage, VerifyEmail, VerifyCodeForm, Guard
│   │   │   ├── dashboard/      # Dashboard
│   │   │   ├── schemes/        # Schemes list & detail
│   │   │   ├── expenses/       # Expense tracker
│   │   │   ├── survey/         # Financial profile survey
│   │   │   ├── profile/        # User profile
│   │   │   ├── blogs/          # Blog CRUD
│   │   │   ├── literacy/       # Financial literacy
│   │   │   └── tracker/        # Financial tracker
│   │   └── routes/
│   │       └── index.jsx       # Route definitions
│   ├── .env / .env.example     # Frontend configuration
│   ├── package.json            # Frontend dependencies
│   └── test/                   # Frontend tests
├── docs/
│   ├── ARCHITECTURE.md         # This file
│   └── NEXT_STEPS.md           # Planned improvements
├── README.md                   # Project overview & setup
└── package.json (root, if any)
```

## 5. Authentication & Email Verification Flow

### 5.1 Registration → Code-Based Email Verification

1. User submits registration form (name, email, password, optional profile photo).
2. Backend creates the user with `emailVerified = false` (when email is configured).
3. Backend generates a 6-digit numeric code, HMAC-hashes it with `EMAIL_TOKEN_SECRET`, stores the hash + expiry on the user document.
4. Backend sends the code to the user's email via Resend (HTML + plain text).
5. Frontend redirects to `/verify-email?email=<email>` showing a 6-digit code input form.
6. User enters the code; frontend POSTs `{ email, code }` to `/auth/verify-email`.
7. Backend verifies the HMAC hash, checks expiry and attempt count, then sets `emailVerified = true` and returns a JWT.
8. Frontend logs the user in and redirects to `/dashboard`.

### 5.2 Resend Verification Code

- User can request a new code from the verification page.
- Backend enforces a 60-second cooldown between resends.
- A new code is generated and emailed; the old hash is replaced.

### 5.3 Login with Unverified Email

- If `emailVerified === false` and `emailVerificationSentAt` exists, login returns `403 EMAIL_NOT_VERIFIED`.
- Older accounts created before email verification was enabled remain usable.

### 5.4 Security Properties

- Verification codes are HMAC-SHA256 hashed (not stored in plain text).
- Codes expire after `EMAIL_TOKEN_EXPIRY` (default: 1 day).
- Maximum 5 incorrect attempts before the code is locked.
- Codes are single-use: cleared after successful verification.
- Email delivery failure does not block account creation (account is auto-verified as fallback).

## 6. Features

### 6.1 Authentication
- User registration with email verification (6-digit code)
- User login with JWT
- Email verification code entry and resend
- Protected routes (JWT middleware)
- Auto-login fallback from localStorage

### 6.2 Government Schemes
- Browse government financial schemes
- Scheme detail pages with eligibility, benefits, documents, application steps
- Official source links for verification
- Personalized recommendations based on user profile

### 6.3 Expense Tracker
- Record everyday expenses with amount, category, note, date
- View spending history and totals

### 6.4 Financial Profile Survey
- Multi-question survey (demographics, income, savings, risk, digital literacy, goals)
- Generates a personalized financial profile
- Drives scheme recommendations

### 6.5 Financial Literacy
- Searchable financial education topics (banking, investments, taxes, digital finance)
- Filter by level (basics, safety, advanced)
- Trusted official source links

### 6.6 Blogs
- Publish and read financial literacy articles
- Rich text editor with markdown support
- Cover image upload (Cloudinary)
- Admin-only create/edit/delete

### 6.7 User Profile
- View and edit personal information
- Financial profile summary
- Profile photo upload (optional, Cloudinary)
- Language preference (EN/HI/KN)

### 6.8 Localization
- Interface available in English, Hindi, and Kannada
- Language persisted in localStorage
- Scheme content primarily in English (localized fields ready for review)

### 6.9 AI Finance Chatbot
- Chat with FinBridge AI about personal finance, government schemes, budgeting, savings, investments, and taxes
- User profile context injected into system prompt for personalized answers
- Last-10-message conversation memory to prevent hallucination
- Persistent chat sessions with history
- Available in EN/HI/KN

## 7. Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `long-random-secret` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CLIENT_URL` | Frontend origin | `http://localhost:5173` |
| `EMAIL_TOKEN_SECRET` | HMAC secret for codes (falls back to JWT_SECRET) | optional |
| `EMAIL_TOKEN_EXPIRY` | Verification code expiry | `1d` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `RESEND_FROM_EMAIL` | Sender email | `onboarding@resend.dev` |
| `CLOUDINARY_URL` / `CLOUDINARY_*` | Cloudinary config (optional) | optional |
| `GOOGLE_API_KEY` | Google AI / Gemini API key | `AIza...` |
| `GEMINI_API_KEY` | Gemini API key (alternative to GOOGLE_API_KEY) | optional |
| `GEMINI_MODEL` | Gemini model name | `models/gemini-3.8-flash` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## 8. Available Scripts

### Backend
- `npm run dev` — Start with nodemon (port 5000)
- `npm start` — Start production server
- `npm run seed` — Seed schemes into MongoDB
- `npm run make-admin` — Promote a user to admin
- `npm test` — Run backend tests
- `npm run check` — Syntax check all source files

### Frontend
- `npm run dev` — Start Vite dev server (port 5173)
- `npm run build` — Production build
- `npm test` — Run frontend tests

## 9. Chatbot (Finance AI) Architecture

### 9.1 Overview

FinBridge AI includes a finance AI chatbot powered by Google Gemini. Users can ask questions about personal finance, government schemes, budgeting, savings, investments, taxes, and financial planning.

### 9.2 Data Flow

```text
Client (React)  ──▶  POST /api/chat/send  ──▶  Express Controller
                                                    │
                                                    ▼
                                          Chat Service
                                                    │
              ┌───────────────────┬─────────────────┴─────────────────┐
              ▼                   ▼                                   ▼
      MongoDB (ChatSession)   User Profile (DB)              Gemini REST API
   (last-10 message queue)   (context for system prompt)   (generateContent)
              │                   │                                   │
              └───────────────────┴───────────────────────────────────┘
                                                    │
                                                    ▼
                                          AI Response ──▶  Client
```

### 9.3 Conversation Memory

To prevent hallucination and keep responses grounded, the chatbot uses:

1. **User context from DB**: On the first message of a session, the backend loads the user's profile (name, email, age group, occupation, income range, state, city, language, financial goals, risk preference) and injects it into the system prompt.
2. **Last-10-message queue**: Only the most recent 10 messages of the current conversation window are sent to Gemini, keeping the context window bounded and focused.
3. **System prompt**: Explicitly instructs the model to act as FinBridge AI's finance assistant, answer in the user's preferred language, focus on Indian personal finance, and avoid giving regulated investment advice.

### 9.4 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat/send` | Send a message, get AI response | Required |
| GET | `/api/chat/history?sessionId=` | Get chat history for a session | Required |
| GET | `/api/chat/sessions` | List user's chat sessions | Required |
| GET | `/api/chat/status` | Check if Gemini is configured | None |

## 10. Future Extension Points

- Phase 3 additions: survey persistence, quiz, RAG-based chat, AI orchestrator (LangGraph), document ingestion → embeddings → vector store → Gemini
- Production auth: short-lived access tokens + secure httpOnly refresh-token cookies with rotation
- Real Hindi/Kannada translations for scheme fields (pending review)
