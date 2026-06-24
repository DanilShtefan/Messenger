import { apiClient } from './axiosInstance';
import type { Comment, CommentsResponse } from '@/shared/types';

export const commentsApi = {
  getByPost: (postId: string, cursor?: string, limit?: number) =>
    apiClient
      .get<CommentsResponse>(`/posts/${postId}/comments`, {
        params: { cursor, limit },
      })
      .then((r) => r.data),

  create: (postId: string, data: { content: string; parentId?: string | null }) =>
    apiClient
      .post<Comment>(`/posts/${postId}/comments`, data)
      .then((r) => r.data),

  delete: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`).then(() => {}),
};
