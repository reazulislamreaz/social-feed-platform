# Buddy Script — AppifyLab Full Stack Selection Task

Converted the provided **Login**, **Registration**, and **Feed** HTML/CSS into a production-minded React + Express + PostgreSQL application.

## Assignment coverage

| Requirement | Status |
|-------------|--------|
| Stick to provided Buddy Script design | Login/Register/Feed use official CSS + assets |
| Auth (JWT) with authorization | Access JWT + HttpOnly refresh cookie (rotated/hashed) |
| Register: first name, last name, email, password | ✅ |
| Feed is a protected route | Frontend guard + `requireAuth` on all feed APIs |
| Create posts (text + image) | Multer → magic-byte check → EXIF strip → local disk |
| Newest posts first | `createdAt DESC` + cursor pagination |
| Like / unlike | Posts, comments, replies (optimistic UI) |
| Show who liked | Real liker names + expandable lists on posts/comments/replies |
| Comments + replies + likes | ✅ |
| Public / private posts | Public for all authed users; private only for author |

## Design fidelity notes

- Official assets live in `frontend/public/assets` (from the selection-task zip).
- Feed uses the **3-column** layout from `feed.html` (`col-xl-3` / `col-xl-6` / `col-xl-3`).
- Left/right sidebars and stories are **decorative chrome** from the mock (allowed: focus on main feed functionality).
- Interactive center column: create post, timeline posts, reactions, comments, replies.

## Stack

- Frontend: React 19, Vite, TypeScript, React Router, TanStack Query, Axios
- Backend: Node.js, Express 5, TypeScript, Zod, bcrypt, Multer
- Database: PostgreSQL (Neon) + Prisma

## Architecture

```
backend/src/
  controllers/   HTTP layer
  services/      business rules + authorization
  middlewares/   auth, upload, errors
  routes/        REST surface
  prisma/        schema

frontend/src/
  pages/         Login, Register, Feed
  components/    Feed shell, post, likes, sidebars
  services/      API client
  context/       Auth session
```

**Scalability:** cursor pagination, denormalized `likeCount`, public/private feed split + indexes, optional Redis feed cache, local or S3/R2 uploads.

**Security:** bcrypt hashing, refresh-token rotation, Helmet, CORS credentials, Zod validation, rate limits on auth/writes/likes, magic-byte image checks + EXIF strip, access JWT in memory only.

### Production images

Frontend (`frontend.sellx.no`) and API (`reaz.sellx.no`) are different origins. Use S3 so uploads persist:

```bash
STORAGE_DRIVER=s3
AWS_S3_BUCKET_NAME=areawins
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
CLIENT_URL=https://frontend.sellx.no
PUBLIC_API_URL=https://reaz.sellx.no
```

Frontend production build:

```bash
VITE_API_URL=https://reaz.sellx.no
```

Bucket needs public `s3:GetObject` (or a CDN in front) so `<img>` tags can load. Old local `/uploads/...` rows in the DB stay broken until those posts are re-uploaded.

## Setup

```bash
# Backend
cd backend
cp .env.example .env
pnpm install
pnpm exec prisma db push
pnpm exec prisma db execute --file prisma/sql/scale.sql --schema prisma/schema.prisma
pnpm dev   # :4000

# Frontend
cd frontend
pnpm install
pnpm dev   # :5173
```

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | cookie |
| POST | `/api/auth/logout` | cookie |
| GET | `/api/auth/me` | bearer |
| GET/POST | `/api/posts` | bearer |
| GET/DELETE | `/api/posts/:id` | bearer |
| GET/POST | `/api/posts/:id/comments` | bearer |
| GET/POST | `/api/comments/:id/replies` | bearer |
| GET/POST/DELETE | `/api/likes` | bearer |

## Deliverables

- Code: this repository
- Docs: this README
- Video / live deploy: add links when recorded/deployed

## Demo

Register a new account, or use `ada@taskbook.dev` / `Secret123` if present in your DB.
