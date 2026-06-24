import type { User } from './user';
import type { Message } from './message';

export interface Dialog {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
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
  name?: string;
}

export interface DialogListItem {
  id: string;
  name?: string | null;
  participant: User | null;
  participants?: Participant[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}
