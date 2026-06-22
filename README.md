# Messenger

Full-stack real-time messaging app with music streaming, movie catalog, and live track sync.

Built with **React + Express + Socket.IO + PostgreSQL**.

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
