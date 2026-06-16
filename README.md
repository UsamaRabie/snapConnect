# SnapConnect

A full-stack social media platform with real-time features, built with the MERN stack.

## Tech Stack

**Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, Socket.io Client, Framer Motion, Lucide Icons, Axios

**Backend:** Node.js, Express, TypeScript, Socket.io, MongoDB (Mongoose), JWT (access + refresh tokens), Zod validation, Cloudinary (image uploads), Multer, Bcrypt, Helmet, Morgan, Compression

**Database:** MongoDB Atlas

**Infrastructure:** Vercel (frontend), Render (backend), AlwaysData (alternative), Cloudinary (media)

## Features

- **Authentication** — Register, login, JWT access/refresh token rotation, protected routes
- **User Profiles** — Avatar, cover image, bio, follower/following/posts counts, edit profile
- **Posts** — Create with image upload, like/unlike, bookmark/save, infinite scroll pagination
- **Comments** — Create, edit, delete, reply threading, real-time via Socket.io
- **Real-time Likes** — Like/unlike syncs across connected clients instantly
- **Follow System** — Follow/unfollow users, follower/following lists
- **Notifications** — Like, comment, reply, follow, tag, message — dropdown preview + full page with "mark all read"
- **Direct Messages** — Real-time chat with Socket.io, conversation list, typing indicator, message notifications
- **Explore** — Discover posts from all users with infinite scroll
- **Search** — Search users by username or full name
- **Dark/Light Mode** — Theme toggle with Tailwind `darkMode: "class"`, persists preference
- **Responsive Design** — Mobile hamburger menu, adaptive layouts, works on all screen sizes
- **Security** — Helmet CSP, rate limiting, input sanitization, Zod validation, bcrypt (12 rounds)
- **Performance** — MongoDB indexes, pagination, lean queries, Cloudinary image optimization, Next.js App Router code splitting

## Project Structure

```
snapconnect/
├── client/                    # Next.js frontend
│   └── src/
│       ├── app/               # App Router pages
│       │   ├── (auth)/        # Login, register
│       │   ├── (main)/        # Feed, explore, profile, messages, notifications, create, post detail, search, saved
│       │   └── globals.css    # Theme CSS variables
│       ├── components/        # Reusable UI components
│       ├── hooks/             # Custom React hooks (usePost, useAuth, etc.)
│       ├── lib/               # Axios client, Socket.io client, API service, utilities
│       ├── store/             # Zustand stores (auth, theme)
│       ├── providers/         # React providers (ThemeProvider)
│       └── types/             # TypeScript type definitions
├── server/                    # Express backend
│   └── src/
│       ├── config/            # DB connection, env config
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, error handler, sanitize, upload
│       ├── models/            # Mongoose schemas (User, Post, Comment, Like, Follow, Notification, Conversation, Message, Story)
│       ├── routes/            # Express routers
│       ├── services/          # Business logic
│       ├── socket/            # Socket.io initialization + events
│       ├── utils/             # Utility functions
│       └── validators/        # Zod validation schemas
└── DEPLOYMENT.md              # Full deployment guide (Render + Vercel)
```

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account (for image uploads)

### Setup

```bash
# Clone the repo
git clone https://github.com/UsamaRabie/snapConnect.git
cd snapConnect

# Server setup
cd server
cp .env.example .env    # Fill in your env vars
npm install
npm run dev             # http://localhost:5000

# Client setup (new terminal)
cd client
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL
npm install
npm run dev                 # http://localhost:3000
```

### Environment Variables

**Server (`server/.env`):** `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `CORS_ORIGIN`

**Client (`client/.env.local`):** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a full guide covering Vercel + Render.


