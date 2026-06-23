import { prisma } from '../db.js';

export const followRepository = {
  async follow(followerId: string, followingId: string) {
    await prisma.follow.create({ data: { followerId, followingId } });
  },

  async unfollow(followerId: string, followingId: string) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  },

  async isFollowing(followerId: string, followingId: string) {
    const row = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!row;
  },

  async getFollowingIds(userId: string) {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return rows.map((r) => r.followingId);
  },

  async getFollowerIds(userId: string) {
    const rows = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    return rows.map((r) => r.followerId);
  },
};
