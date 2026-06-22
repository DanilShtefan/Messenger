import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../middleware/auth.middleware.js';

let io: Server;

const onlineUsers = new Set<string>();
const userSockets = new Map<string, Set<string>>();

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

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          onlineUsers.delete(userId);
          io.emit('user:offline', userId);
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
