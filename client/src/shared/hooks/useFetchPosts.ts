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
    queryClient.setQueryData(queryKey, (old: typeof data) => {
      if (!old) return { pages: [{ posts: [post], cursor: null }], pageParams: [undefined] };
      return {
        ...old,
        pages: [{ posts: [post, ...old.pages[0].posts], cursor: old.pages[0].cursor }, ...old.pages.slice(1)],
      };
    });
  }, [queryClient, queryKey]);

  const removePost = useCallback((postId: string) => {
    queryClient.setQueryData(queryKey, (old: typeof data) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((p) => p.id !== postId),
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
  };
}
