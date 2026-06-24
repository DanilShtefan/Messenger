import { apiClient } from './axiosInstance';
import type { Dialog, DialogListItem, CreateDialogRequest } from '@/shared/types';

export const chatsApi = {
  getAll: () =>
    apiClient.get<DialogListItem[]>('/chats').then((r) => r.data),

  getById: (dialogId: string) =>
    apiClient.get<Dialog>(`/chats/${dialogId}`).then((r) => r.data),

  create: (data: CreateDialogRequest) =>
    apiClient.post<Dialog>('/chats', data).then((r) => r.data),

  getOrCreateByUserId: (userId: string) =>
    apiClient.post<Dialog>('/chats/direct', { participantId: userId }).then((r) => r.data),

  addParticipant: (dialogId: string, userId: string) =>
    apiClient.post<Dialog>(`/chats/${dialogId}/participants`, { userId }).then((r) => r.data),

  removeParticipant: (dialogId: string, userId: string) =>
    apiClient.delete(`/chats/${dialogId}/participants/${userId}`).then((r) => r.data),

  markAsRead: (dialogId: string) =>
    apiClient.post(`/chats/${dialogId}/read`).then((r) => r.data),
};
