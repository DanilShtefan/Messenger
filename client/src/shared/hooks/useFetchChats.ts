import { useCallback, useEffect, useState } from 'react';
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

export function useFetchChats(): UseFetchChatsReturn {
  const [chats, setChats] = useState<DialogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  useEffect(() => {
    document.title = totalUnread > 0 ? `Messenger (${totalUnread})` : 'Messenger';
  }, [totalUnread]);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatsApi.getAll();
      setChats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chats';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const updateChatLastMessage = useCallback(
    (dialogId: string, content: string, createdAt: string) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === dialogId
            ? {
                ...chat,
                lastMessage: { id: '', content, senderId: '', dialogId, createdAt, updatedAt: createdAt, readAt: null },
                updatedAt: createdAt,
              }
            : chat,
        ),
      );
    },
    [],
  );

  const resetUnreadCount = useCallback((dialogId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === dialogId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );
  }, []);

  const incrementUnread = useCallback((dialogId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === dialogId ? { ...chat, unreadCount: chat.unreadCount + 1 } : chat,
      ),
    );
  }, []);

  return { chats, isLoading, error, refetch: fetchChats, updateChatLastMessage, resetUnreadCount, incrementUnread };
}
