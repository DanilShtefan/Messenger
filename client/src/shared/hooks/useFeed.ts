import { useCallback, useEffect } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { followApi } from '@/shared/api/follow.api';
import { postsApi } from '@/shared/api/posts.api';
import { connectSocket } from '@/shared/lib/socket';
import { syncLikeAcrossCaches } from '@/shared/lib/syncLikeAcrossCaches';
import type { Post } from '@/shared/types';

interface UseFeedReturn {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  toggleLike: (postId: string) => void;
  updateViewCount: (postId: string, viewsCount: number) => void;
}

const LIMIT = 10;

const feedQueryKey = ['feed'] as const;

export function useFeed(): UseFeedReturn {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: ({ pageParam }) => followApi.getFeed(pageParam ?? undefined, LIMIT),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    staleTime: 30_000,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  useEffect(() => {
    const socket = connectSocket();
    const handler = (newPost: Post) => {
      queryClient.setQueryData(feedQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: [
            { posts: [newPost, ...old.pages[0].posts], cursor: old.pages[0].cursor },
            ...old.pages.slice(1),
          ],
        };
      });
    };
    socket.on('feed:newPost', handler);
    return () => { socket.off('feed:newPost', handler); };
  }, [queryClient]);

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleLike = useCallback(async (postId: string) => {
    const prev = queryClient.getQueryData(feedQueryKey);
    queryClient.setQueryData(feedQueryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: Post) =>
            p.id === postId
              ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
              : p,
          ),
        })),
      };
    });
    try {
      const result = await postsApi.toggleLike(postId);
      queryClient.setQueryData(feedQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: Post) =>
              p.id === postId
                ? { ...p, likedByMe: result.likedByMe, likeCount: result.likeCount }
                : p,
            ),
          })),
        };
      });
      syncLikeAcrossCaches(queryClient, postId, result.likedByMe, result.likeCount);
    } catch {
      queryClient.setQueryData(feedQueryKey, prev);
    }
  }, [queryClient]);

  const updateViewCount = useCallback((postId: string, viewsCount: number) => {
    queryClient.setQueryData(feedQueryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: Post) =>
            p.id === postId ? { ...p, viewsCount } : p,
          ),
        })),
      };
    });
  }, [queryClient]);

  return {
    posts,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    loadMore,
    toggleLike,
    updateViewCount,
  };
}
