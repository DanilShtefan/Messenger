import path from 'node:path';
import https from 'node:https';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { messageRoutes } from './routes/message.routes.js';
import { friendRoutes } from './routes/friend.routes.js';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(import.meta.dirname, '../uploads')));

app.get('/api/music/chart', (_req, res) => {
  https.get('https://api.deezer.com/chart/0/tracks?limit=50', (deezerRes) => {
    let body = '';
    deezerRes.on('data', (chunk) => (body += chunk));
    deezerRes.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        res.json(parsed.data);
      } catch {
        res.status(502).json({ message: 'Failed to parse tracks' });
      }
    });
  }).on('error', () => res.status(502).json({ message: 'Failed to fetch tracks' }));
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { statusCode: 429, message: 'Too many requests, try again later' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);

function fetchIaMovies(query: string, sort: string, rows: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const q = query ? `AND+title:(${encodeURIComponent(query)})` : '';
    const url = `https://archive.org/advancedsearch.php?q=collection:feature_films+AND+mediatype:movies${q}&fl[]=identifier,title,description,avg_rating,downloads&sort[]=${sort.replace(/\+/g, '%20')}&rows=${rows}&output=json`;
    https.get(url, (iaRes) => {
      let body = '';
      iaRes.on('data', (chunk) => (body += chunk));
      iaRes.on('end', () => {
        try { resolve(JSON.parse(body).response?.docs ?? []); }
        catch { reject(new Error('Failed to parse')); }
      });
    }).on('error', reject);
  });
}

app.get('/api/movies/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    const results = await fetchIaMovies(q || '', 'downloads+desc', 20);
    res.json({ results });
  } catch { res.status(502).json({ message: 'Failed to fetch from IA' }); }
});

app.use(errorHandler);

export { app };
