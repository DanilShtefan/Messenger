import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env, corsOrigin } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { messageRoutes } from './routes/message.routes.js';
import { friendRoutes } from './routes/friend.routes.js';
import { postRoutes } from './routes/post.routes.js';
import followRoutes from './routes/follow.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/healthz', (_req, res) => res.send('ok'));

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
app.use('/api', postRoutes);
app.use('/api/follow', followRoutes);

function fetchJson(url: string): Promise<any> {
  const mod = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    mod.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('Failed to parse')); }
      });
    }).on('error', reject);
  });
}

function fetchIaMovies(query: string, sort: string, rows: number): Promise<any[]> {
  const q = query ? `+AND+title:(${encodeURIComponent(query)})` : '';
  const url = `http://archive.org/advancedsearch.php?q=collection:feature_films+AND+mediatype:movies${q}&fl[]=identifier,title,description,avg_rating,downloads&sort[]=${sort.replace(/\+/g, '%20')}&rows=${rows}&output=json`;
  return fetchJson(url).then((d) => d.response?.docs ?? []);
}

app.get('/api/movies/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    const results = await fetchIaMovies(q || '', 'downloads+desc', 20);
    res.json({ results });
  } catch { res.status(502).json({ message: 'Failed to fetch from IA' }); }
});

app.get('/api/movies/video/:identifier', async (req, res) => {
  try {
    const data = await fetchJson(`http://archive.org/metadata/${req.params.identifier}`);
    const file = data.files?.find(
      (f: any) => f.source === 'original' && (f.format === 'MPEG4' || f.format === 'h.264'),
    );
    const name = file ? file.name : `${req.params.identifier}.mp4`;
    res.json({ url: `http://archive.org/download/${req.params.identifier}/${encodeURIComponent(name)}` });
  } catch {
    res.json({ url: `http://archive.org/download/${req.params.identifier}/${req.params.identifier}.mp4` });
  }
});

if (env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

export { app };
