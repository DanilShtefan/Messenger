import type { User } from '@prisma/client';
import { prisma } from '../db.js';

export const userRepository = {
  findByEmail: (email: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { id } }),

  create: (data: Pick<User, 'email' | 'passwordHash' | 'displayName'>): Promise<User> =>
    prisma.user.create({ data }),

  update: (id: string, data: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'about'>>): Promise<User> =>
    prisma.user.update({ where: { id }, data }),

  findAll: (): Promise<User[]> =>
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),

  countFriends: async (userId: string) => {
    const rows = await prisma.friend.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
    });
    const ids = new Set<string>();
    rows.forEach((f) => ids.add(f.userId === userId ? f.friendId : f.userId));
    return ids.size;
  },

  findMutualFriendIds: async (userId: string, otherUserId: string): Promise<string[]> => {
    const [userFriends, otherFriends] = await Promise.all([
      prisma.friend.findMany({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { friendId: userId, status: 'ACCEPTED' },
          ],
        },
      }),
      prisma.friend.findMany({
        where: {
          OR: [
            { userId: otherUserId, status: 'ACCEPTED' },
            { friendId: otherUserId, status: 'ACCEPTED' },
          ],
        },
      }),
    ]);

    const userFriendIds = new Set<string>();
    userFriends.forEach((f) => {
      userFriendIds.add(f.userId === userId ? f.friendId : f.userId);
    });

    const mutualIds = new Set<string>();
    otherFriends.forEach((f) => {
      const id = f.userId === otherUserId ? f.friendId : f.userId;
      if (userFriendIds.has(id)) mutualIds.add(id);
    });

    return Array.from(mutualIds);
  },
};
