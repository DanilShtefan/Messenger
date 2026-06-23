import { postRepository } from '../repositories/post.repository.js';
import { ApiError } from '../errors/ApiError.js';
import { emitNewPost } from '../socket/index.js';

export const postService = {
  async getByUser(userId: string, cursor?: string, limit = 10, currentUserId?: string) {
    const posts = await postRepository.findByAuthor(userId, cursor, limit, currentUserId);
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    // Record views for non-author authenticated users
    if (currentUserId && currentUserId !== userId) {
      for (const post of posts) {
        postRepository.addView(post.id, currentUserId).catch(() => {});
      }
    }

    return {
      posts: posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      cursor: hasMore ? posts.at(-1)?.id ?? null : null,
    };
  },

  async create(authorId: string, content: string, imageUrl?: string | null) {
    const post = await postRepository.create({
      content,
      imageUrl: imageUrl ?? null,
      authorId,
    });
    const result = {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
    emitNewPost(result, authorId).catch(() => {});
    return result;
  },

  async delete(postId: string, userId: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');
    if (post.authorId !== userId) throw ApiError.forbidden('Cannot delete this post');
    await postRepository.delete(postId);
  },

  async toggleLike(postId: string, userId: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');
    return postRepository.toggleLike(postId, userId);
  },

  async addView(postId: string, userId: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');
    if (post.authorId === userId) return { viewsCount: await postRepository.getViewsCount(postId) };
    await postRepository.addView(postId, userId);
    const viewsCount = await postRepository.getViewsCount(postId);
    return { viewsCount };
  },
};
