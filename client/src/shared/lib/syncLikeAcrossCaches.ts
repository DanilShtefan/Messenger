import { type QueryClient } from '@tanstack/react-query';
import type { Post } from '@/shared/types';

export function syncLikeAcrossCaches(
  queryClient: QueryClient,
  postId: string,
  likedByMe: boolean,
  likeCount: number,
) {
  const caches = queryClient.getQueryCache().findAll({
    queryKey: ['feed'],
  });
  const profileCaches = queryClient.getQueryCache().findAll({
    queryKey: ['posts'],
  });
  const all = [...caches, ...profileCaches];

  for (const cache of all) {
    queryClient.setQueryData(cache.queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: Post) =>
            p.id === postId ? { ...p, likedByMe, likeCount } : p,
          ),
        })),
      };
    });
  }
}
