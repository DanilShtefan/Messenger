import { useCallback, useEffect, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { friendsApi } from '@/shared/api/friends.api';
import type { User } from '@/shared/types';

interface UseFetchFriendsReturn {
  friends: User[];
  incoming: User[];
  sent: User[];
  suggested: User[];
  isLoading: boolean;
  error: string | null;
  sendRequest: (userId: string) => Promise<void>;
  acceptRequest: (userId: string) => Promise<void>;
  rejectRequest: (userId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFetchFriends(): UseFetchFriendsReturn {
  const [friends, setFriends] = useState<User[]>([]);
  const [incoming, setIncoming] = useState<User[]>([]);
  const [sent, setSent] = useState<User[]>([]);
  const [suggested, setSuggested] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [friendsData, incomingData, sentData, suggestedData] = await Promise.all([
        friendsApi.getAll(),
        friendsApi.getIncoming(),
        friendsApi.getSent(),
        friendsApi.getSuggested(),
      ]);
      setFriends(friendsData);
      setIncoming(incomingData);
      setSent(sentData);
      setSuggested(suggestedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load friends';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const socket = connectSocket();

    function handleFriendEvent() {
      fetchAll();
    }

    socket.on('friend:request', handleFriendEvent);
    socket.on('friend:accept', handleFriendEvent);
    socket.on('friend:reject', handleFriendEvent);

    return () => {
      socket.off('friend:request', handleFriendEvent);
      socket.off('friend:accept', handleFriendEvent);
      socket.off('friend:reject', handleFriendEvent);
    };
  }, [fetchAll]);

  const sendRequest = useCallback(async (userId: string) => {
    const result = await friendsApi.add(userId);
    if (!result.autoAccepted) {
      // Optimistically add to incoming so UI shows "Request sent"
      setSuggested((prev) => prev.filter((u) => u.id !== userId));
    }
    await fetchAll();
  }, [fetchAll]);

  const acceptRequest = useCallback(async (userId: string) => {
    await friendsApi.accept(userId);
    await fetchAll();
  }, [fetchAll]);

  const rejectRequest = useCallback(async (userId: string) => {
    await friendsApi.reject(userId);
    await fetchAll();
  }, [fetchAll]);

  const removeFriend = useCallback(async (userId: string) => {
    await friendsApi.remove(userId);
    await fetchAll();
  }, [fetchAll]);

  return { friends, incoming, sent, suggested, isLoading, error, sendRequest, acceptRequest, rejectRequest, removeFriend, refetch: fetchAll };
}
