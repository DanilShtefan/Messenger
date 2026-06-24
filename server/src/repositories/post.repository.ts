import { prisma } from '../db.js';

export const postRepository = {
  findByAuthor(authorId: string, cursor?: string, limit = 10, currentUserId?: string) {
    return prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, views: true, comments: true } },
        ...(currentUserId
          ? { likes: { where: { userId: currentUserId }, take: 1 } }
          : {}),
        views: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    }).then(async (rows) => {
      const postIds = rows.map((r: any) => r.id);
      const userViews = currentUserId
        ? await prisma.postView.findMany({
            where: { postId: { in: postIds }, userId: currentUserId },
            select: { postId: true },
          })
        : [];
      const viewedSet = new Set(userViews.map((v: any) => v.postId));

      return rows.map((r) => {
        const { _count, likes, views, ...rest } = r as any;
        return {
          ...rest,
          likeCount: _count.likes,
          likedByMe: currentUserId ? (likes?.length ?? 0) > 0 : false,
          viewedByMe: viewedSet.has(r.id),
          viewsCount: _count.views,
          commentCount: _count.comments,
          viewersPreview: {
            viewers: views.map((v: any) => v.user),
            totalCount: _count.views,
          },
        };
      });
    });
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
    }).then((p) => ({
      ...p,
      likeCount: 0,
      likedByMe: false,
      viewedByMe: false,
      viewsCount: 0,
      commentCount: 0,
      viewersPreview: { viewers: [], totalCount: 0 },
    }));
  },

  update(id: string, data: { content?: string; imageUrl?: string | null }) {
    return prisma.post.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.post.delete({ where: { id } });
  },

  async toggleLike(postId: string, userId: string) {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
    } else {
      await prisma.postLike.create({ data: { postId, userId } });
    }
    const count = await prisma.postLike.count({ where: { postId } });
    return { likedByMe: !existing, likeCount: count };
  },

  async addView(postId: string, userId: string) {
    await prisma.postView.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });
  },

  async getViewsCount(postId: string) {
    return prisma.postView.count({ where: { postId } });
  },

  findByAuthors(authorIds: string[], cursor?: string, limit = 10, currentUserId?: string) {
    return prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, views: true, comments: true } },
        ...(currentUserId
          ? { likes: { where: { userId: currentUserId }, take: 1 } }
          : {}),
        views: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    }).then(async (rows) => {
      const postIds = rows.map((r: any) => r.id);
      const userViews = currentUserId
        ? await prisma.postView.findMany({
            where: { postId: { in: postIds }, userId: currentUserId },
            select: { postId: true },
          })
        : [];
      const viewedSet = new Set(userViews.map((v: any) => v.postId));

      return rows.map((r) => {
        const { _count, likes, views, ...rest } = r as any;
        return {
          ...rest,
          likeCount: _count.likes,
          likedByMe: currentUserId ? (likes?.length ?? 0) > 0 : false,
          viewedByMe: viewedSet.has(r.id),
          viewsCount: _count.views,
          commentCount: _count.comments,
          viewersPreview: {
            viewers: views.map((v: any) => v.user),
            totalCount: _count.views,
          },
        };
      });
    });
  },
};
