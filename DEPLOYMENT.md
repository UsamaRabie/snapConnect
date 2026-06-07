# SnapConnect Deployment Guide

## Architecture

```
[Vercel CDN] → [Next.js (client/)] → [Render (server/)] → [MongoDB Atlas]
```

---

## Prerequisites

- [Vercel](https://vercel.com) account (GitHub login)
- [Render](https://render.com) account (GitHub login)
- [MongoDB Atlas](https://cloud.mongodb.com) cluster
- [Cloudinary](https://cloudinary.com) account (for image uploads)
- Git repository pushed to GitHub

---

## Step 1: MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a **Free (M0) cluster** or use existing
3. Under **Security → Database Access**, create a database user with read/write permissions
4. Under **Security → Network Access**, add `0.0.0.0/0` (allow all) for Render
5. Click **Connect → Connect your application**
6. Copy the connection string (starts with `mongodb+srv://`)
7. Replace `<password>` with your database user password

**Your connection string:**
```
mongodb+srv://usamarabie:snapConnectP@ssword@cluster0.yu52ayn.mongodb.net/snapconnect?retryWrites=true&w=majority
```

---

## Step 2: Cloudinary

1. Go to [cloudinary.com/console](https://cloudinary.com/console)
2. Copy your **Cloud Name**, **API Key**, and **API Secret**
3. These will be used in Render environment variables

---

## Step 3: Deploy Server to Render

### A. Create a New Web Service

1. Log in to [render.com](https://render.com)
2. Click **New + → Web Service**
3. Connect your GitHub repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `snapconnect-api` |
   | **Region** | Ohio (US East) |
   | **Branch** | `main` |
   | **Runtime** | Node |
   | **Build Command** | `cd server && npm install && npm run build` |
   | **Start Command** | `cd server && npm start` |
   | **Plan** | Free |

5. **Root Directory** must be left blank. The build/start commands handle `cd server`.

### B. Environment Variables

Add these in the Render dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://usamarabie:snapConnectP@ssword@cluster0.yu52ayn.mongodb.net/snapconnect?retryWrites=true&w=majority` |
| `JWT_ACCESS_SECRET` | Generate: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Generate: `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary console |
| `CLOUDINARY_API_KEY` | From Cloudinary console |
| `CLOUDINARY_API_SECRET` | From Cloudinary console |
| `CORS_ORIGIN` | `https://snapconnect.vercel.app` |
| `RATE_LIMIT_MAX` | `200` |

### C. Deploy

Click **Create Web Service**. First build takes 3-5 minutes.

### D. Verify

Once deployed, visit `https://snapconnect-api.onrender.com/api/v1/health`

Expected response:
```json
{ "status": "success", "message": "SnapConnect API is running", ... }
```

---

## Step 4: Deploy Client to Vercel

### A. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository

### B. Configure Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |

### C. Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://snapconnect-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_BASE_URL` | `https://snapconnect.vercel.app` |

### D. Deploy

Click **Deploy**. First build takes 2-3 minutes.

---

## Step 5: Verify End-to-End

1. Visit `https://snapconnect.vercel.app`
2. Register a new account
3. Upload a profile picture
4. Create a post with an image
5. Like and comment on posts
6. Follow other users

---

## Production Checklist

### Security
- [x] Helmet.js security headers (CSP, XSS, clickjacking)
- [x] Rate limiting on all API routes
- [x] Auth-specific rate limiting (20 req/15min)
- [x] JWT access + refresh token rotation
- [x] Password hashing with bcrypt (salt rounds 12)
- [x] Input validation with Zod on all endpoints
- [x] CORS restricted to production domain
- [x] `trust proxy` enabled for Render
- [x] `X-Frame-Options: DENY`
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Compression enabled (gzip)
- [x] Request body size limited (10mb)

### Performance
- [x] MongoDB indexes on all query patterns
- [x] Pagination on all list endpoints
- [x] Lean queries for read-only operations
- [x] Image optimization via Cloudinary
- [x] Next.js Image component with AVIF/WebP
- [x] Code splitting via Next.js App Router
- [x] Tree-shakeable icon imports (lucide-react)
- [x] Optimized package imports
- [x] Static asset caching (1 year immutable)
- [x] Incremental Static Regeneration ready

### SEO
- [x] Metadata API on all pages
- [x] Open Graph tags (title, description, image)
- [x] Twitter Card tags
- [x] Sitemap.xml (auto-generated)
- [x] Robots.txt (auto-generated)
- [x] Semantic HTML structure
- [x] Responsive meta tag
- [x] Canonical URLs
- [x] Metadata base URL configured

### Monitoring
- [ ] Set up Sentry or similar error tracking
- [ ] Set up uptime monitoring (betterstack.com free)
- [ ] Enable MongoDB Atlas monitoring alerts
- [ ] Configure Render deployment notifications

### Post-Deployment
- [ ] Test registration flow
- [ ] Test file uploads (avatar, cover, posts)
- [ ] Test follow/unfollow
- [ ] Test like/unlike with socket sync
- [ ] Test comment CRUD with socket sync
- [ ] Test notifications delivery
- [ ] Test search functionality
- [ ] Test dark/light mode toggle
- [ ] Test mobile responsiveness
- [ ] Test rate limiting (rapid requests)
- [ ] Test with Chrome Lighthouse (aim for 90+)
- [ ] Verify MongoDB connection pool settings

---

## Maintenance

### MongoDB Backup
Atlas provides automated backups on paid tiers. For free tier, use `mongodump`:
```bash
mongodump --uri="mongodb+srv://..." --out=./backup-$(date +%Y%m%d)
```

### Logs
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Analytics → Logs

### Updates
```bash
git pull origin main
# Server redeploys automatically on Render
# Client redeploys automatically on Vercel
```

### Environment Variables Changes
- Render: Dashboard → Service → Environment → Edit → Save → Manual Deploy
- Vercel: Dashboard → Project → Settings → Environment Variables → Save → Redeploy
