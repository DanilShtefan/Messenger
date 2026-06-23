import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { messagesApi } from '@/shared/api/messages.api';
import { connectSocket } from '@/shared/lib/socket';
import type { Message } from '@/shared/types';

interface UseFetchMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addMessage: (msg: Message) => void;
  markAsRead: () => void;
}

const LIMIT = 30;

export function useFetchMessages(dialogId: string): UseFetchMessagesReturn {
  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const queryKey = useMemo(() => ['messages', dialogId] as const, [dialogId]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => messagesApi.getByDialog(dialogId, pageParam ?? undefined, LIMIT),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    staleTime: 30_000,
    enabled: !!dialogId,
  });

  const messages = data?.pages.toReversed().flatMap((p) => p.messages) ?? [];

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const addMessage = useCallback((msg: Message) => {
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any, i: number) =>
          i === 0
            ? { ...page, messages: [...page.messages, msg] }
            : page,
        ),
      };
    });
  }, [queryClient, queryKey]);

  const addMessageRef = useRef(addMessage);
  addMessageRef.current = addMessage;
  const userIdRef = useRef(currentUserId);
  userIdRef.current = currentUserId;

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:dialog', dialogId);

    const handler = (msg: Message) => {
      if (msg.dialogId === dialogId && msg.senderId !== userIdRef.current) {
        addMessageRef.current(msg);
      }
    };
    socket.on('message:new', handler);
    return () => {
      socket.emit('leave:dialog', dialogId);
      socket.off('message:new', handler);
    };
  }, [dialogId]);

  const markAsRead = useCallback(() => {
    const now = new Date().toISOString();
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((msg: Message) =>
            msg.readAt ? msg : { ...msg, readAt: now },
          ),
        })),
      };
    });
  }, [queryClient, queryKey]);

  return {
    messages,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    loadMore,
    addMessage,
    markAsRead,
  };
}
