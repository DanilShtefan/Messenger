import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import { userRepository } from '../repositories/user.repository.js';
import type { JwtPayload } from '../middleware/auth.middleware.js';
import { prisma } from '../db.js';

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
  const refreshToken = crypto.randomUUID();

  return { accessToken, refreshToken };
}

function sanitizeUser(user: { id: string; email: string; displayName: string; avatarUrl: string | null; about: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    about: user.about,
    createdAt: user.createdAt.toISOString(),
  };
}

export const authService = {
  async register(data: { email: string; password: string; displayName: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
    });

    const tokens = generateTokens({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: sanitizeUser(user), tokens };
  },

  async login(data: { email: string; password: string }) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: sanitizeUser(user), tokens };
  },

  async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = generateTokens({ userId: stored.user.id, email: stored.user.email });

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: sanitizeUser(stored.user), tokens };
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  },
};
