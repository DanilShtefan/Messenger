import { prisma } from '../db.js';

const commentInclude = {
  author: { select: { id: true, displayName: true, avatarUrl: true } },
  replies: {
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const commentRepository = {
  async findByPost(postId: string, cursor?: string, limit = 20) {
    const rows = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: commentInclude,
    });
    return rows.map((c) => ({
      id: c.id,
      content: c.content,
      postId: c.postId,
      authorId: c.authorId,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        postId: r.postId,
        authorId: r.authorId,
        parentId: r.parentId,
        createdAt: r.createdAt.toISOString(),
        author: r.author,
        replies: [],
      })),
    }));
  },

  findById(id: string) {
    return prisma.comment.findUnique({ where: { id }, include: commentInclude });
  },

  async create(data: { content: string; postId: string; authorId: string; parentId?: string | null }) {
    const c = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId: data.authorId,
        parentId: data.parentId ?? null,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    return {
      id: c.id,
      content: c.content,
      postId: c.postId,
      authorId: c.authorId,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      replies: [],
    };
  },

  delete(id: string) {
    return prisma.comment.delete({ where: { id } });
  },

  async countByPost(postId: string) {
    return prisma.comment.count({ where: { postId } });
  },
};
