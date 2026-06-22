import { apiClient } from './axiosInstance';
import type { Message, SendMessageRequest, MessagesResponse, PaginationParams } from '@/shared/types';

export const messagesApi = {
  getByDialog: (dialogId: string, params?: PaginationParams) =>
    apiClient
      .get<MessagesResponse>(`/messages/${dialogId}`, { params })
      .then((r) => r.data),

  send: (data: SendMessageRequest) =>
    apiClient.post<Message>('/messages', data).then((r) => r.data),
};
