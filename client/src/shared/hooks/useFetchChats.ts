import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '@/shared/api/chats.api';
import { connectSocket } from '@/shared/lib/socket';
import { useAppSelector } from '@/app/hooks';
import type { DialogListItem, Message } from '@/shared/types';

interface UseFetchChatsReturn {
  chats: DialogListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  resetUnreadCount: (dialogId: string) => void;
}

const CHATS_KEY = ['chats'] as const;

export function useFetchChats(): UseFetchChatsReturn {
  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);

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
    queryClient.setQueryData<DialogListItem[]>(CHATS_KEY, (prev) => {
      if (!prev) return prev;
      const updated = prev.map((chat) => (chat.id === dialogId ? updater(chat) : chat));
      updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return updated;
    });
  }, [queryClient]);

  const resetUnreadCount = useCallback((dialogId: string) => {
    updateChat(dialogId, (chat) => ({ ...chat, unreadCount: 0 }));
  }, [updateChat]);

  const userIdRef = useRef(currentUserId);
  userIdRef.current = currentUserId;

  const joinedRef = useRef(new Set<string>());

  useEffect(() => {
    const socket = connectSocket();

    for (const chat of chats) {
      if (!joinedRef.current.has(chat.id)) {
        joinedRef.current.add(chat.id);
        socket.emit('join:dialog', chat.id);
      }
    }
  }, [chats]);

  useEffect(() => {
    const socket = connectSocket();

    const handleMessage = (msg: Message) => {
      updateChat(msg.dialogId, (chat) => ({
        ...chat,
        lastMessage: msg,
        updatedAt: msg.createdAt,
      }));
      if (msg.senderId !== userIdRef.current) {
        updateChat(msg.dialogId, (c) => ({ ...c, unreadCount: c.unreadCount + 1 }));
      }
    };

    const handleDialogCreated = () => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY });
    };

    const handleDialogRead = (data: { dialogId: string }) => {
      updateChat(data.dialogId, (chat) => ({ ...chat, unreadCount: 0 }));
    };

    const handleMessageUpdated = (msg: Message) => {
      updateChat(msg.dialogId, (chat) => ({
        ...chat,
        lastMessage: chat.lastMessage?.id === msg.id ? msg : chat.lastMessage,
      }));
    };

    socket.on('message:new', handleMessage);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('dialog:created', handleDialogCreated);
    socket.on('dialog:read', handleDialogRead);

    return () => {
      socket.off('message:new', handleMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('dialog:created', handleDialogCreated);
      socket.off('dialog:read', handleDialogRead);
    };
  }, [queryClient, updateChat]);

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load chats' : null;

  return { chats, isLoading, error, refetch: () => refetch().then(() => {}), resetUnreadCount };
}
