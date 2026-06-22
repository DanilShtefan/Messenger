import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '@/shared/api/chats.api';
import type { DialogListItem } from '@/shared/types';

interface UseFetchChatsReturn {
  chats: DialogListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateChatLastMessage: (dialogId: string, content: string, createdAt: string) => void;
  resetUnreadCount: (dialogId: string) => void;
  incrementUnread: (dialogId: string) => void;
}

const CHATS_KEY = ['chats'] as const;

export function useFetchChats(): UseFetchChatsReturn {
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: CHATS_KEY,
    queryFn: () => chatsApi.getAll(),
    staleTime: 30_000,
  });

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  useEffect(() => {
    document.title = totalUnread > 0 ? `Messenger (${totalUnread})` : 'Messenger';
  }, [totalUnread]);

  const updateChat = useCallback((dialogId: string, updater: (chat: DialogListItem) => DialogListItem) => {
    queryClient.setQueryData<DialogListItem[]>(CHATS_KEY, (prev) =>
      prev ? prev.map((chat) => (chat.id === dialogId ? updater(chat) : chat)) : prev,
    );
  }, [queryClient]);

  const updateChatLastMessage = useCallback(
    (dialogId: string, content: string, createdAt: string) => {
      updateChat(dialogId, (chat) => ({
        ...chat,
        lastMessage: { id: '', content, senderId: '', dialogId, createdAt, updatedAt: createdAt, readAt: null },
        updatedAt: createdAt,
      }));
    },
    [updateChat],
  );

  const resetUnreadCount = useCallback((dialogId: string) => {
    updateChat(dialogId, (chat) => ({ ...chat, unreadCount: 0 }));
  }, [updateChat]);

  const incrementUnread = useCallback((dialogId: string) => {
    updateChat(dialogId, (chat) => ({ ...chat, unreadCount: chat.unreadCount + 1 }));
  }, [updateChat]);

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load chats' : null;

  return { chats, isLoading, error, refetch: () => refetch().then(() => {}), updateChatLastMessage, resetUnreadCount, incrementUnread };
}
