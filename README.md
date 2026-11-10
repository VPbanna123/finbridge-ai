# FinBridge AI

FinBridge AI is a financial inclusion web application that helps users discover government schemes, track expenses, complete a financial profile survey, and access financial literacy content. It features JWT authentication with **6-digit email verification codes**, multilingual support (English, Hindi, Kannada), and personalized scheme recommendations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router DOM |
| State | Zustand (persisted in localStorage) |
| HTTP Client | Axios |
| i18n | i18next + react-i18next (EN / HI / KN) |
| Backend | Node.js + Express 5 (ES modules) |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | JWT + bcryptjs |
| Email | Resend (6-digit verification codes) |
| File Storage | Cloudinary (images, profile photos) |
| Validation | express-validator + Zod |

## Project Structure

```
finbridge-ai/
├── backend/            # Express REST API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic (auth, email, schemes, ...)
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── middlewares/   # auth, validate, asyncHandler
│   │   ├── utils/         # Helpers
│   │   ├── config/        # DB + env config
│   │   ├── seed.js        # Database seeder
│   │   ├── app.js         # Express app
│   │   └── server.js      # Server entry
│   ├── .env / .env.example
│   ├── package.json
│   └── test/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── api/          # Axios API clients
│   │   ├── features/     # Feature modules (auth, dashboard, schemes, ...)
│   │   ├── stores/       # Zustand stores
│   │   ├── lib/          # Zod schemas + utils
│   │   ├── config/       # Env config
│   │   ├── i18n.js       # Translations (EN/HI/KN)
│   │   ├── App.jsx
│   │   └── routes/
│   ├── .env / .env.example
│   ├── package.json
│   └── test/
├── docs/
│   ├── ARCHITECTURE.md  # Full architecture & tech stack
│   └── NEXT_STEPS.md    # Planned improvements
└── README.md            # This file
```

## Features

- **Authentication**: Register, login, 6-digit email verification code, resend code, JWT-protected routes
- **Government Schemes**: Browse schemes, view details (eligibility, benefits, documents, application steps), official source links
- **Personalized Recommendations**: Scheme suggestions based on user financial profile
- **Expense Tracker**: Record and view everyday expenses
- **Financial Profile Survey**: Multi-question survey that generates a personalized financial profile
- **Financial Literacy**: Searchable topics in banking, investments, taxes, digital finance (EN/HI/KN)
- **Blogs**: Read and (admin) publish financial literacy articles with image uploads
- **User Profile**: Edit personal info, upload profile photo, set language preference
- **Localization**: English, Hindi, and Kannada interface

## Prerequisites

- Node.js 20 or newer and npm
- A MongoDB database (MongoDB Atlas recommended)
- A Resend API key (for email verification codes)
- Cloudinary credentials (optional, for image uploads)

## Quick Start

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend (in another terminal)
cd frontend
npm install
cp .env.example .env
```

### 2. Configure environment variables

**Backend** (`backend/.env`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/finbridge
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Email verification (Resend)
EMAIL_TOKEN_SECRET=
EMAIL_TOKEN_EXPIRY=1d
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# Cloudinary (optional - blog images, profile photos)
CLOUDINARY_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AI chatbot (Groq primary, Gemini fallback)
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=
GEMINI_MODEL=models/gemini-3.8-flash
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

> Do not commit `.env` files.

### 3. Seed the database and start the backend

```bash
cd backend
npm run seed      # inserts schemes (safe - won't overwrite existing)
npm run dev       # API on port 5000
```

### 4. Start the frontend

```bash
cd frontend
npm run dev       # App on port 5173
```

Open `http://localhost:5173` in your browser.

## Email Verification (6-Digit Code)

After registering, the backend sends a 6-digit verification code to the user's email via Resend. The user is redirected to `/verify-email` where they enter the code. Once verified, they receive a JWT and are logged in.

- Codes expire after `EMAIL_TOKEN_EXPIRY` (default: 1 day)
- Maximum 5 incorrect attempts before the code is locked
- A new code can be requested (60-second cooldown between resends)
- If email is not configured, accounts are auto-verified (no lockout)

## Available Scripts

### Backend

```bash
cd backend
npm run dev       # Start with nodemon
npm start         # Start production server
npm run seed      # Seed schemes into MongoDB
npm run make-admin # Promote a user to admin
npm test          # Run backend tests
npm run check     # Syntax check source files
```

### Frontend

```bash
cd frontend
npm run dev       # Start Vite dev server
npm run build     # Production build
npm test          # Run frontend tests
```

## Checks

```bash
cd backend
npm test
npm run check
```

```bash
cd frontend
npm test
npm run build
```

## Database & External Services

- **MongoDB Atlas**: Stores users, schemes, expenses, survey responses, blogs
- **Resend**: Sends verification code emails
- **Cloudinary**: Stores blog images, profile photos, whiteboard exports (optional)

## Documentation

- `docs/ARCHITECTURE.md` — Full system architecture, tech stack, data flow, auth/verification flow, environment variables, and feature list
- `docs/NEXT_STEPS.md` — Planned improvements and Phase 3 roadmap

## License

MIT
