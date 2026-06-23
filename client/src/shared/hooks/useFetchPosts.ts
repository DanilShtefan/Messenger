import { useCallback } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsApi } from '@/shared/api/posts.api';
import type { Post } from '@/shared/types';

interface UseFetchPostsReturn {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addPost: (post: Post) => void;
  removePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  updateViewCount: (postId: string, viewsCount: number) => void;
}

const LIMIT = 10;

export function useFetchPosts(userId: string): UseFetchPostsReturn {
  const queryClient = useQueryClient();
  const queryKey = ['posts', userId];

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => postsApi.getByUser(userId, pageParam ?? undefined, LIMIT),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    staleTime: 30_000,
    enabled: !!userId,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const addPost = useCallback((post: Post) => {
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return { pages: [{ posts: [post], cursor: null }], pageParams: [undefined] };
      return {
        ...old,
        pages: [{ posts: [post, ...old.pages[0].posts], cursor: old.pages[0].cursor }, ...old.pages.slice(1)],
      };
    });
  }, [queryClient, queryKey]);

  const removePost = useCallback((postId: string) => {
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((p: Post) => p.id !== postId),
        })),
      };
    });
  }, [queryClient, queryKey]);

  const toggleLike = useCallback(async (postId: string) => {
    const prev = queryClient.getQueryData(queryKey);
    // Optimistic update
    queryClient.setQueryData(queryKey, (old: any) => {
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
      await postsApi.toggleLike(postId);
    } catch {
      // Rollback on error
      queryClient.setQueryData(queryKey, prev);
    }
  }, [queryClient, queryKey]);

  const updateViewCount = useCallback((postId: string, viewsCount: number) => {
    queryClient.setQueryData(queryKey, (old: any) => {
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
  }, [queryClient, queryKey]);

  return {
    posts,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    loadMore,
    addPost,
    removePost,
    toggleLike,
    updateViewCount,
  };
}
