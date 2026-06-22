import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/shared/api/profile.api';
import type { UserProfile } from '@/shared/types';

interface UseFetchProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
}

export function useFetchProfile(userId: string): UseFetchProfileReturn {
  const queryClient = useQueryClient();
  const profileKey = ['profile', userId] as const;

  const { data: profile = null, isLoading, error: queryError, refetch } = useQuery({
    queryKey: profileKey,
    queryFn: () => profileApi.getById(userId),
    staleTime: 30_000,
  });

  const setProfile = useCallback((newProfile: UserProfile | null) => {
    queryClient.setQueryData(profileKey, newProfile);
  }, [queryClient, profileKey]);

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load profile' : null;

  return { profile, isLoading, error, refetch: () => refetch().then(() => {}), setProfile };
}
