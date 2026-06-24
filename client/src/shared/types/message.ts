export interface Message {
  id: string;
  content: string;
  senderId: string;
  dialogId: string;
  reactions: Record<string, string[]> | null;
  forwardedFrom: { senderName: string; content: string; senderId: string } | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  sender?: { id: string; displayName: string; avatarUrl: string | null };
}

export interface SendMessageRequest {
  content: string;
  dialogId: string;
  forwardedFrom?: { senderName: string; content: string; senderId: string } | null;
}

export interface MessagesResponse {
  messages: Message[];
  cursor: string | null;
}
