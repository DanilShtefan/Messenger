import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/ui';
import { formatDate } from '@/shared/lib/helpers';
import type { Post } from '@/shared/types';
import styles from './ProfilePosts.module.css';

interface PostCardProps {
  post: Post;
  isOwn: boolean;
  onDeleted: (postId: string) => void;
}

export function PostCard({ post, isOwn, onDeleted }: PostCardProps) {
  const { t } = useTranslation('common');

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="sm" />
        <div className={styles.cardMeta}>
          <span className={styles.cardName}>{post.author.displayName}</span>
          <span className={styles.cardTime}>{formatDate(post.createdAt)}</span>
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
    </div>
  );
}
