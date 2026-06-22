import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '@/shared/api/messages.api';
import type { Message, PaginationParams } from '@/shared/types';

interface UseFetchMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  addMessage: (msg: Message) => void;
  markAsRead: () => void;
}

const LIMIT = 30;

export function useFetchMessages(dialogId: string): UseFetchMessagesReturn {
  const messagesKey = ['messages', dialogId] as const;
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const { data, isLoading, error: queryError, refetch: queryRefetch } = useQuery({
    queryKey: [...messagesKey, page],
    queryFn: async () => {
      const params: PaginationParams = { page, limit: LIMIT };
      const result = await messagesApi.getByDialog(dialogId, params);
      return result;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setLocalMessages(data.messages);
      setTotal(data.total);
    }
  }, [data]);

  const hasMore = total > page * LIMIT;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const params: PaginationParams = { page: nextPage, limit: LIMIT };
      const result = await messagesApi.getByDialog(dialogId, params);
      setLocalMessages((prev) => [...result.messages, ...prev]);
      setTotal(result.total);
      setPage(nextPage);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }, [dialogId, isLoadingMore, hasMore, page]);

  const refetch = useCallback(async () => {
    setPage(1);
    await queryRefetch();
  }, [queryRefetch]);

  const addMessage = useCallback((msg: Message) => {
    setLocalMessages((prev) => [...prev, msg]);
  }, []);

  const markAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.readAt ? msg : { ...msg, readAt: now })),
    );
  }, []);

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load messages' : null;

  return { messages: localMessages, isLoading, isLoadingMore, error, hasMore, loadMore, refetch, addMessage, markAsRead };
}
