import { postRepository } from '../repositories/post.repository.js';
import { ApiError } from '../errors/ApiError.js';

export const postService = {
  async getByUser(userId: string, cursor?: string, limit = 10) {
    const posts = await postRepository.findByAuthor(userId, cursor, limit);
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

  async create(authorId: string, content: string, imageUrl?: string | null) {
    const post = await postRepository.create({
      content,
      imageUrl: imageUrl ?? null,
      authorId,
    });
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  async delete(postId: string, userId: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');
    if (post.authorId !== userId) throw ApiError.forbidden('Cannot delete this post');
    await postRepository.delete(postId);
  },

  async updateImage(postId: string, userId: string, imageUrl: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');
    if (post.authorId !== userId) throw ApiError.forbidden('Cannot edit this post');
    return postRepository.update(postId, { imageUrl });
  },
};
