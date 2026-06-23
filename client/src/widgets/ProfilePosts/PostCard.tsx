import { useEffect, useRef } from 'react';
import { Trash2, Heart, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/ui';
import { formatPostDate } from '@/shared/lib/helpers';
import { postsApi } from '@/shared/api/posts.api';
import type { Post } from '@/shared/types';
import styles from './ProfilePosts.module.css';

interface PostCardProps {
  post: Post;
  isOwn: boolean;
  onDeleted: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onView: (postId: string) => void;
}

export function PostCard({ post, isOwn, onDeleted, onToggleLike, onView }: PostCardProps) {
  const { t } = useTranslation('common');
  const cardRef = useRef<HTMLDivElement>(null);
  const viewSent = useRef(false);

  useEffect(() => {
    if (viewSent.current || isOwn) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewSent.current = true;
          onView(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id, isOwn, onView]);

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.cardHeader}>
        <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="sm" />
        <div className={styles.cardMeta}>
          <span className={styles.cardName}>{post.author.displayName}</span>
          <span className={styles.cardTime}>{formatPostDate(post.createdAt)}</span>
        </div>
        {isOwn && (
          <button className={styles.deleteBtn} onClick={() => onDeleted(post.id)} title="Delete">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p className={styles.cardContent}>{post.content}</p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className={styles.cardImage} loading="lazy" />
      )}
      <div className={styles.cardStats}>
        <button
          className={`${styles.statBtn} ${post.likedByMe ? styles.liked : ''}`}
          onClick={() => onToggleLike(post.id)}
        >
          <Heart size={16} fill={post.likedByMe ? 'currentColor' : 'none'} />
          <span>{post.likeCount}</span>
        </button>
        <span className={styles.statBtn}>
          <Eye size={16} />
          <span>{post.viewsCount}</span>
        </span>
      </div>
    </div>
  );
}
