import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const FRIENDS_KEY = ['friends'] as const;

export function useFetchFriends(): UseFetchFriendsReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: FRIENDS_KEY,
    queryFn: async () => {
      const [friendsData, incomingData, sentData, suggestedData] = await Promise.all([
        friendsApi.getAll(),
        friendsApi.getIncoming(),
        friendsApi.getSent(),
        friendsApi.getSuggested(),
      ]);
      return { friends: friendsData, incoming: incomingData, sent: sentData, suggested: suggestedData };
    },
    staleTime: 30_000,
  });

  const friends = data?.friends ?? [];
  const incoming = data?.incoming ?? [];
  const sent = data?.sent ?? [];
  const suggested = data?.suggested ?? [];

  const refetchAll = useCallback(() => refetch().then(() => {}), [refetch]);

  useEffect(() => {
    const socket = connectSocket();

    function handleFriendEvent() {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
    }

    socket.on('friend:request', handleFriendEvent);
    socket.on('friend:accept', handleFriendEvent);
    socket.on('friend:reject', handleFriendEvent);

    return () => {
      socket.off('friend:request', handleFriendEvent);
      socket.off('friend:accept', handleFriendEvent);
      socket.off('friend:reject', handleFriendEvent);
    };
  }, [queryClient]);

  const sendRequest = useCallback(async (userId: string) => {
    await friendsApi.add(userId);
    await queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
  }, [queryClient]);

  const acceptRequest = useCallback(async (userId: string) => {
    await friendsApi.accept(userId);
    await queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
  }, [queryClient]);

  const rejectRequest = useCallback(async (userId: string) => {
    await friendsApi.reject(userId);
    await queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
  }, [queryClient]);

  const removeFriend = useCallback(async (userId: string) => {
    await friendsApi.remove(userId);
    await queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
  }, [queryClient]);

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load friends' : null;

  return { friends, incoming, sent, suggested, isLoading, error, sendRequest, acceptRequest, rejectRequest, removeFriend, refetch: refetchAll };
}
