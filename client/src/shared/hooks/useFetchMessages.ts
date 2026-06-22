import { useCallback, useEffect, useState } from 'react';
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

export function useFetchMessages(dialogId: string): UseFetchMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const fetchMessages = useCallback(async (pageNum: number, append = false) => {
    const params: PaginationParams = { page: pageNum, limit: LIMIT };
    try {
      const data = await messagesApi.getByDialog(dialogId, params);
      setMessages((prev) => (append ? [...data.messages, ...prev] : data.messages));
      setHasMore(data.total > pageNum * LIMIT);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
    }
  }, [dialogId]);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchMessages(1).finally(() => setIsLoading(false));
  }, [fetchMessages]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage, true);
    setIsLoadingMore(false);
  }, [fetchMessages, isLoadingMore, hasMore, page]);

  const refetch = useCallback(async () => {
    setPage(1);
    await fetchMessages(1);
  }, [fetchMessages]);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const markAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setMessages((prev) =>
      prev.map((msg) => (msg.readAt ? msg : { ...msg, readAt: now })),
    );
  }, []);

  return { messages, isLoading, isLoadingMore, error, hasMore, loadMore, refetch, addMessage, markAsRead };
}
