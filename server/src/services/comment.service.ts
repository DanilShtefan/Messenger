import { commentRepository } from '../repositories/comment.repository.js';
import { postRepository } from '../repositories/post.repository.js';
import { ApiError } from '../errors/ApiError.js';
import { getIO } from '../socket/index.js';

export const commentService = {
  async getByPost(postId: string, cursor?: string, limit = 20) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');

    const comments = await commentRepository.findByPost(postId, cursor, limit);
    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();

    return {
      comments,
      cursor: hasMore ? comments.at(-1)?.id ?? null : null,
    };
  },

  async create(postId: string, authorId: string, content: string, parentId?: string | null) {
    const post = await postRepository.findById(postId);
    if (!post) throw ApiError.notFound('Post not found');

    if (parentId) {
      const parent = await commentRepository.findById(parentId);
      if (!parent || parent.postId !== postId) throw ApiError.notFound('Parent comment not found');
    }

    const comment = await commentRepository.create({ content, postId, authorId, parentId });

    getIO().emit('post:comment', { postId, comment });

    return comment;
  },

  async delete(commentId: string, userId: string) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId) throw ApiError.forbidden('Cannot delete this comment');

    await commentRepository.delete(commentId);

    getIO().emit('post:comment:deleted', { postId: comment.postId, commentId });
  },
};
