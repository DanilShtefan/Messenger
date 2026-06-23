import { followRepository } from '../repositories/follow.repository.js';
import { postRepository } from '../repositories/post.repository.js';

export const followService = {
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');
    const is = await followRepository.isFollowing(followerId, followingId);
    if (is) {
      await followRepository.unfollow(followerId, followingId);
      return { isFollowing: false };
    }
    await followRepository.follow(followerId, followingId);
    return { isFollowing: true };
  },

  async isFollowing(followerId: string, followingId: string) {
    return followRepository.isFollowing(followerId, followingId);
  },

  async getFeed(userId: string, cursor?: string, limit = 10) {
    const followingIds = await followRepository.getFollowingIds(userId);
    if (followingIds.length === 0) {
      return { posts: [], cursor: null };
    }
    const posts = await postRepository.findByAuthors(followingIds, cursor, limit, userId);

    // Record views for feed posts
    for (const post of posts) {
      if (post.authorId !== userId) {
        postRepository.addView(post.id, userId).catch(() => {});
      }
    }

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    return {
      posts: posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      cursor: hasMore ? posts.at(-1)?.id ?? null : null,
    };
  },
};
