export interface Message {
  id: string;
  content: string;
  senderId: string;
  dialogId: string;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export interface SendMessageRequest {
  content: string;
  dialogId: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}
