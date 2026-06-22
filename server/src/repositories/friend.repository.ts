import { prisma } from '../db.js';
import type { FriendStatus } from '@prisma/client';

const friendInclude = { friend: { select: { id: true, email: true, displayName: true, avatarUrl: true, about: true, createdAt: true } } };
const userInclude = { user: { select: { id: true, email: true, displayName: true, avatarUrl: true, about: true, createdAt: true } } };

export const friendRepository = {
  findByUserId: (userId: string, status?: FriendStatus) =>
    prisma.friend.findMany({
      where: { userId, ...(status ? { status } : {}) },
      include: friendInclude,
      orderBy: { createdAt: 'desc' },
    }),

  findByFriendId: (friendId: string, status?: FriendStatus) =>
    prisma.friend.findMany({
      where: { friendId, ...(status ? { status } : {}) },
      include: userInclude,
      orderBy: { createdAt: 'desc' },
    }),

  findFriendship: (userId: string, friendId: string) =>
    prisma.friend.findUnique({
      where: { userId_friendId: { userId, friendId } },
    }),

  add: (userId: string, friendId: string, status: FriendStatus = 'PENDING') =>
    prisma.friend.create({ data: { userId, friendId, status } }),

  accept: (userId: string, friendId: string) =>
    prisma.friend.update({
      where: { userId_friendId: { userId, friendId } },
      data: { status: 'ACCEPTED' },
    }),

  remove: (userId: string, friendId: string) =>
    prisma.friend.delete({
      where: { userId_friendId: { userId, friendId } },
    }),
};
