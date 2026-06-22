# Messenger

Full-stack real-time messaging app (React + Express + Socket.IO).

## Features

- Registration / Login (JWT)
- Real-time private messaging via WebSockets
- Friend system: send / accept / reject / remove requests
- Online status
- User profiles with avatar upload, editable name & bio
- Friend count & mutual friends display
- Suggested friends

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
