import { apiClient } from './axiosInstance';
import type { PostsResponse } from '@/shared/types';

export const followApi = {
  toggleFollow: (userId: string) =>
    apiClient.post<{ isFollowing: boolean }>(`/follow/${userId}`).then((r) => r.data),

  getFeed: (cursor?: string, limit = 10) =>
    apiClient.get<PostsResponse>('/follow/feed', {
      params: { cursor, limit },
    }).then((r) => r.data),
};
