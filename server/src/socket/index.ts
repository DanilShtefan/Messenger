import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../middleware/auth.middleware.js';

let io: Server;

const onlineUsers = new Set<string>();
const userSockets = new Map<string, Set<string>>();

export interface SyncTrack {
  id: number;
  title: string;
  artist: string;
  cover: string;
  preview: string;
  duration: number;
}

export interface SyncData {
  track: SyncTrack | null;
  position: number;
  playing: boolean;
  timestamp: number;
  index: number;
}

const currentTracks = new Map<string, { title: string; artist: string; cover: string } | null>();
const currentMovies = new Map<string, { title: string; identifier: string } | null>();
const currentPlayback = new Map<string, SyncData | null>();
const listeningSessions = new Map<string, Set<string>>();

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).user.userId as string;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    const sockets = userSockets.get(userId)!;
    const wasOffline = sockets.size === 0;
    sockets.add(socket.id);

    socket.join(`user:${userId}`);

    if (wasOffline) {
      onlineUsers.add(userId);
      io.emit('user:online', userId);
    }

    // Send current listener count on (re)connect
    const existingSession = listeningSessions.get(userId);
    if (existingSession) {
      socket.emit('session:listeners', { hostId: userId, count: existingSession.size });
    }

    socket.on('join:dialog', (dialogId: string) => {
      socket.join(`dialog:${dialogId}`);
    });

    socket.on('leave:dialog', (dialogId: string) => {
      socket.leave(`dialog:${dialogId}`);
    });

    socket.on('typing:start', (dialogId: string) => {
      socket.to(`dialog:${dialogId}`).emit('typing:start', { dialogId, userId });
    });

    socket.on('typing:stop', (dialogId: string) => {
      socket.to(`dialog:${dialogId}`).emit('typing:stop', { dialogId, userId });
    });

    socket.on('music:play', (track: { title: string; artist: string; cover: string }) => {
      currentTracks.set(userId, track);
      socket.broadcast.emit('friend:music', { userId, track });
    });

    socket.on('music:stop', () => {
      currentTracks.set(userId, null);
      socket.broadcast.emit('friend:music', { userId, track: null });
    });

    // Sync playback
    socket.on('music:sync', (data: SyncData) => {
      currentPlayback.set(userId, data);
      const session = listeningSessions.get(userId);
      if (session) {
        for (const joinerId of session) {
          io.to(`user:${joinerId}`).emit('music:sync-state', { hostId: userId, data });
        }
      }
    });

    function emitListenerCount(hostId: string) {
      const count = listeningSessions.get(hostId)?.size ?? 0;
      io.to(`user:${hostId}`).emit('session:listeners', { hostId, count });
    }

    socket.on('music:join', (hostId: string) => {
      if (!listeningSessions.has(hostId)) {
        listeningSessions.set(hostId, new Set());
      }
      listeningSessions.get(hostId)!.add(userId);
      socket.join(`session:${hostId}`);
      emitListenerCount(hostId);

      const state = currentPlayback.get(hostId) ?? null;
      socket.emit('music:sync-state', { hostId, data: state });
    });

    socket.on('music:leave', () => {
      for (const [hostId, joiners] of listeningSessions) {
        if (joiners.has(userId)) {
          joiners.delete(userId);
          const hadJoiners = joiners.size > 0;
          if (!hadJoiners) listeningSessions.delete(hostId);
          socket.leave(`session:${hostId}`);
          emitListenerCount(hostId);
          break;
        }
      }
    });

    socket.on('movie:play', (movie: { title: string; identifier: string }) => {
      currentMovies.set(userId, movie);
      socket.broadcast.emit('friend:movie', { userId, movie });
    });

    socket.on('movie:stop', () => {
      currentMovies.set(userId, null);
      socket.broadcast.emit('friend:movie', { userId, movie: null });
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          onlineUsers.delete(userId);
          io.emit('user:offline', userId);
          // Clean up sessions
          for (const [hostId, joiners] of listeningSessions) {
            if (joiners.has(userId) || hostId === userId) {
              if (hostId === userId) {
                for (const joinerId of joiners) {
                  io.to(`user:${joinerId}`).emit('music:session-ended', { hostId: userId });
                }
                listeningSessions.delete(hostId);
                io.to(`user:${userId}`).emit('session:listeners', { hostId: userId, count: 0 });
              } else {
                joiners.delete(userId);
                if (joiners.size === 0) listeningSessions.delete(hostId);
                emitListenerCount(hostId);
              }
              break;
            }
          }
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function getUserCurrentTrack(userId: string) {
  return currentTracks.get(userId) ?? null;
}

export function getUserCurrentMovie(userId: string) {
  return currentMovies.get(userId) ?? null;
}
