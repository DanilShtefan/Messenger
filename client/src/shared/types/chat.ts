import type { User } from './user';
import type { Message } from './message';

export interface Dialog {
  id: string;
  createdAt: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Participant {
  userId: string;
  dialogId: string;
  joinedAt: string;
  user: User;
}

export interface CreateDialogRequest {
  participantIds: string[];
}

export interface DialogListItem {
  id: string;
  participant: User;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}
