import { apiClient } from './axiosInstance';
import type { Post, PostsResponse } from '@/shared/types';

export const postsApi = {
  getByUser: (userId: string, cursor?: string, limit = 10) =>
    apiClient.get<PostsResponse>(`/users/${userId}/posts`, {
      params: { cursor, limit },
    }).then((r) => r.data),

  create: (data: { content: string; image?: File }) => {
    const form = new FormData();
    form.append('content', data.content);
    if (data.image) form.append('image', data.image);
    return apiClient.post<Post>('/users/me/posts', form).then((r) => r.data);
  },

  delete: (postId: string) =>
    apiClient.delete(`/posts/${postId}`),
};
