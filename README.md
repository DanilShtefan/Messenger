# Messenger

Full-stack real-time messaging app with music streaming, movie catalog, and live track sync.

## Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 6** | Build tool & dev server |
| **TanStack React Query** | Server state management, caching, data fetching |
| **Redux Toolkit** | Client state management (auth, user) |
| **React Router DOM v7** | Client-side routing |
| **Axios** | HTTP client |
| **Socket.IO Client** | Real-time WebSocket communication |
| **i18next** | Internationalization (EN / RU) |
| **Lucide React** | Icon library |
| **Zod** | Schema validation |
| **CSS Modules** | Scoped styling |
| **jwt-decode** | JWT token parsing |

### Backend
| Library | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express 4** | HTTP server & routing |
| **TypeScript** | Type safety |
| **Prisma ORM** | Database ORM & migrations |
| **PostgreSQL** | Database |
| **Socket.IO** | Real-time WebSocket server |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Multer** | File uploads |
| **express-rate-limit** | Rate limiting |
| **Zod** | Input validation |
| **tsx** | TypeScript execution for development |

### DevOps & Tools
- **Concurrently** — monorepo script runner
- **Render** — deployment platform

## Features

### 💬 Messaging
- Registration / Login (JWT)
- Real-time private messaging via WebSockets
- Typing indicators
- Online / offline status

### 👥 Friends
- Send / accept / reject / remove friend requests
- Suggested friends
- Mutual friends count

### 👤 Profiles
- Editable display name & bio
- Avatar upload
- Shows currently playing track and movie
- Join / Leave real-time listening session with one click

### 🎵 Music (Deezer)
- 50-track chart from Deezer
- Play / pause / prev / next / seek / volume
- Bottom player bar persists across all pages
- Mini player in sidebar
- Volume saved in localStorage

### 🔁 Real-Time Track Sync
- **Join a friend's listening session** and hear exactly what they hear
- Position, playing state, and track index are synced in real time
- Latency compensation: position is calculated using server timestamps
- When the host pauses, seeks, or skips — your player follows instantly
- Leave anytime with one click
- Host controls remain local; joined users receive passive sync
- Listener count badge in the sidebar

### 🎬 Movies (Internet Archive)
- Browse 28,000+ public domain feature films
- Search by title with debounced input
- Grid of poster cards with hover play overlay
- Native `<video>` player with direct IA video URLs (no iframe)
- Shows "Watching" on profile with movie poster

### 🔁 Real-Time Movie Sync
- **Join a friend's watch session** and see exactly what they see
- Position, play/pause synced in real time with latency compensation
- When the host pauses, seeks, or plays — your player follows instantly
- Leave anytime or close the modal to exit the session
- Listener count badge in the sidebar

## Quick start

```bash
# 1. Start PostgreSQL
# 2. Server
cd server
npm install
npx prisma migrate dev
npm run dev

# 3. Client
cd client
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Render

This project is optimized for deployment on [Render](https://render.com), including the free tier. Render instances automatically sleep when idle and wake up when there's traffic, which can cause database connections to disconnect and reconnect.

### Key Features for Render Deployment:

- **Automatic migrations**: Runs `npx prisma migrate deploy` on startup to apply all pending migrations
- **Database connection retries**: Automatically retries database connections up to 5 times with exponential backoff
- **Resilient initialization**: Ensures database is ready before starting the HTTP server
- **Graceful shutdown**: Properly disconnects database connections on SIGTERM/SIGINT signals

### Render Setup:

1. **Connect PostgreSQL database** to Render:
   - Create a PostgreSQL database on Render or use an existing one
   - Note the connection string (DATABASE_URL)

2. **Set environment variables in Render Dashboard**:
   ```bash
   NODE_ENV=production
   PORT=10000
   DATABASE_URL="your-database-url"
   JWT_ACCESS_SECRET="your-access-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   CLIENT_URL="https://your-client-domain.com"
   ```

3. **Render configuration**:
   - **Build Command**: `npx prisma generate && npx tsc`
   - **Start Command**: `node dist/index.js`
   - **Instance Type**: Standard (Free tier supports 15 minutes sleep time)

4. **Database persistence**:
   - Render PostgreSQL databases persist data between restarts
   - Your data will be preserved across Render sleep/wake cycles

### Notes:

- The free tier uses shared VMs that sleep after 15 minutes of inactivity
- After sleep/wake cycles, the application will automatically reconnect to the database
- Migration scripts run each time the server starts to ensure the schema is up-to-date
- Database seeding only runs if the database is completely empty (useful for fresh deployments)

Admin:
  Email:    admin@admin.admin
  Password: 123456
  Name:     Admin

Alice:
  Email:    alice@test.com
  Password: password123
  Name:     Alice Johnson

Bob:
  Email:    bob@test.com
  Password: password123
  Name:     Bob Smith

Charlie:
  Email:    charlie@test.com
  Password: password123
  Name:     Charlie Brown

Diana:
  Email:    diana@test.com
  Password: password123
  Name:     Diana Prince

Eve:
  Email:    eve@test.com
  Password: password123
  Name:     Eve Wilson

Frank:
  Email:    frank@test.com
  Password: password123
  Name:     Frank Castle

Grace:
  Email:    grace@test.com
  Password: password123
  Name:     Grace Hopper

Henry:
  Email:    henry@test.com
  Password: password123
  Name:     Henry Ford

Iris:
  Email:    iris@test.com
  Password: password123
  Name:     Iris West
