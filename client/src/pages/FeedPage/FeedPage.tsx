import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeed } from '@/shared/hooks/useFeed';
import { postsApi } from '@/shared/api/posts.api';
import { PostCard } from '@/widgets/ProfilePosts/PostCard';
import { Skeleton } from '@/shared/ui';
import styles from './FeedPage.module.css';

export function FeedPage() {
  const { t } = useTranslation('common');
  const { posts, isLoading, isLoadingMore, hasMore, loadMore, toggleLike, updateViewCount } = useFeed();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleView = useCallback(async (postId: string) => {
    try {
      const { viewsCount } = await postsApi.addView(postId);
      updateViewCount(postId, viewsCount);
    } catch {}
  }, [updateViewCount]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('feed.title')}</h1>
      <div className={styles.list}>
        {isLoading ? (
          <>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <Skeleton width={32} height={32} borderRadius="50%" />
                <div className={styles.skeletonMeta}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="25%" height={11} />
                </div>
              </div>
              <Skeleton width="100%" height={14} />
              <Skeleton width="80%" height={14} />
            </div>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <Skeleton width={32} height={32} borderRadius="50%" />
                <div className={styles.skeletonMeta}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="25%" height={11} />
                </div>
              </div>
              <Skeleton width="100%" height={14} />
              <Skeleton width="60%" height={14} />
            </div>
          </>
        ) : posts.length === 0 ? (
          <p className={styles.empty}>{t('feed.empty')}</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwn={false}
              onDeleted={() => {}}
              onToggleLike={toggleLike}
              onView={handleView}
            />
          ))
        )}
        {isLoadingMore && <p className={styles.loading}>{t('loading')}</p>}
        <div ref={sentinelRef} />
      </div>
    </div>
  );
}
