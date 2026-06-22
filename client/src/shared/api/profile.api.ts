import { apiClient } from './axiosInstance';
import type { User, UserProfile } from '@/shared/types';

export const profileApi = {
  getById: (userId: string) =>
    apiClient.get<UserProfile>(`/users/${userId}`).then((r) => r.data),

  updateProfile: (data: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'about'>>) =>
    apiClient.patch<User>('/users/me', data).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post<UserProfile>('/users/me/avatar', form).then((r) => r.data);
  },
};
