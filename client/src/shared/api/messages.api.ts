import { apiClient } from './axiosInstance';
import type { Message, SendMessageRequest, MessagesResponse } from '@/shared/types';

export const messagesApi = {
  getByDialog: (dialogId: string, cursor?: string, limit = 30) =>
    apiClient
      .get<MessagesResponse>(`/messages/${dialogId}`, { params: { cursor, limit } })
      .then((r) => r.data),

  send: (data: SendMessageRequest) =>
    apiClient.post<Message>('/messages', data).then((r) => r.data),

  update: (messageId: string, content: string) =>
    apiClient.put<Message>(`/messages/${messageId}`, { content }).then((r) => r.data),
};
