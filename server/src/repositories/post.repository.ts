import { prisma } from '../db.js';

export const postRepository = {
  findByAuthor(authorId: string, cursor?: string, limit = 10) {
    return prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }) as Promise<Array<{
      id: string; content: string; imageUrl: string | null;
      authorId: string; createdAt: Date; updatedAt: Date;
      author: { id: string; displayName: string; avatarUrl: string | null };
    }>>;
  },

  findById(id: string) {
    return prisma.post.findUnique({ where: { id } });
  },

  create(data: { content: string; imageUrl?: string | null; authorId: string }) {
    return prisma.post.create({
      data,
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }) as Promise<{
      id: string; content: string; imageUrl: string | null;
      authorId: string; createdAt: Date; updatedAt: Date;
      author: { id: string; displayName: string; avatarUrl: string | null };
    }>;
  },

  update(id: string, data: { imageUrl?: string | null }) {
    return prisma.post.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.post.delete({ where: { id } });
  },
};
