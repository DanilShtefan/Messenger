import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchPosts } from '@/shared/hooks/useFetchPosts';
import { postsApi } from '@/shared/api/posts.api';
import { Skeleton } from '@/shared/ui';
import { PostInput } from './PostInput';
import { PostCard } from './PostCard';
import type { Post } from '@/shared/types';
import styles from './ProfilePosts.module.css';

interface ProfilePostsProps {
  userId: string;
  isOwn: boolean;
}

export function ProfilePosts({ userId, isOwn }: ProfilePostsProps) {
  const { t } = useTranslation('common');
  const { posts, isLoading, isLoadingMore, hasMore, loadMore, addPost, removePost, editPost, toggleLike, updateViewCount } = useFetchPosts(userId);
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

  const handlePostCreated = (post: Post) => addPost(post);

  const handleDeleted = async (postId: string) => {
    try {
      await postsApi.delete(postId);
      removePost(postId);
    } catch {}
  };

  const handleEdit = (postId: string, content: string, imageUrl?: string | null) => {
    editPost(postId, content, imageUrl);
  };

  const handleView = useCallback(async (postId: string) => {
    try {
      const { viewsCount } = await postsApi.addView(postId);
      updateViewCount(postId, viewsCount);
    } catch {}
  }, [updateViewCount]);

  return (
    <div className={styles.wrapper}>
      {isOwn && <PostInput onPostCreated={handlePostCreated} />}
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
          <p className={styles.status}>{t('profile.no_bio')}</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwn={isOwn}
              onDeleted={handleDeleted}
              onToggleLike={toggleLike}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))
        )}
        {isLoadingMore && <p className={styles.status}>Loading more...</p>}
        <div ref={sentinelRef} />
      </div>
    </div>
  );
}
