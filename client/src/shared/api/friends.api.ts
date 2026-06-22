import { apiClient } from './axiosInstance';
import type { User } from '@/shared/types';

export const friendsApi = {
  getAll: () =>
    apiClient.get<User[]>('/friends').then((r) => r.data),

  getIncoming: () =>
    apiClient.get<User[]>('/friends/incoming').then((r) => r.data),

  getSent: () =>
    apiClient.get<User[]>('/friends/sent').then((r) => r.data),

  getSuggested: () =>
    apiClient.get<User[]>('/friends/suggested').then((r) => r.data),

  add: (userId: string) =>
    apiClient.post<{ autoAccepted?: boolean }>('/friends/add', { userId }).then((r) => r.data),

  accept: (userId: string) =>
    apiClient.post('/friends/accept', { userId }).then((r) => r.data),

  reject: (userId: string) =>
    apiClient.post('/friends/reject', { userId }).then((r) => r.data),

  remove: (userId: string) =>
    apiClient.post('/friends/remove', { userId }).then((r) => r.data),
};
