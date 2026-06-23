import { useEffect, useRef, useState } from 'react';
import { Trash2, Heart, Eye, Pencil, Check, X } from 'lucide-react';
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
  onEdit: (postId: string, content: string, imageUrl?: string | null) => void;
}

export function PostCard({ post, isOwn, onDeleted, onToggleLike, onView, onEdit }: PostCardProps) {
  const { t } = useTranslation('common');
  const cardRef = useRef<HTMLDivElement>(null);
  const viewSent = useRef(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [editing, editContent.length]);

  useEffect(() => {
    if (!editing) setEditContent(post.content);
  }, [post.content, editing]);

  async function handleSave() {
    const content = editContent.trim();
    const hasChanges = content !== post.content || editImage !== null || removeExistingImage;
    if (!hasChanges) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const result = await postsApi.update(post.id, {
        content,
        image: editImage ?? undefined,
        removeImage: removeExistingImage && !editImage,
      });
      onEdit(post.id, result.content, result.imageUrl);
      setEditing(false);
    } catch {} finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditContent(post.content);
    setEditImage(null);
    setEditImagePreview(null);
    setRemoveExistingImage(false);
    setEditing(false);
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImage(file);
    setRemoveExistingImage(false);
    setEditImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setEditImage(null);
    setEditImagePreview(null);
    if (post.imageUrl) setRemoveExistingImage(true);
  }

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.cardHeader}>
        <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="sm" />
        <div className={styles.cardMeta}>
          <span className={styles.cardName}>{post.author.displayName}</span>
          <span className={styles.cardTime}>{formatPostDate(post.createdAt)}</span>
        </div>
        {isOwn && !editing && (
          <>
            <button className={styles.editBtn} onClick={() => setEditing(true)} title="Edit">
              <Pencil size={14} />
            </button>
            <button className={styles.deleteBtn} onClick={() => onDeleted(post.id)} title="Delete">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
      {editing ? (
        <div className={styles.editArea}>
          <textarea
            ref={textareaRef}
            className={styles.editTextarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={1000}
            rows={3}
          />
          <div className={styles.editImageSection}>
            {!removeExistingImage && (editImagePreview || post.imageUrl) && (
              <div className={styles.editImageWrap}>
                <img
                  src={editImagePreview ?? post.imageUrl!}
                  alt=""
                  className={styles.editImage}
                />
                <button className={styles.removeImageBtn} onClick={handleRemoveImage} type="button">
                  <X size={14} />
                </button>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleEditImageChange}
            />
            {!editImagePreview && !removeExistingImage && (
              <button className={styles.addImageBtn} onClick={() => imageInputRef.current?.click()} type="button">
                {post.imageUrl ? t('profile.change_image') : t('profile.add_image')}
              </button>
            )}
          </div>
          <div className={styles.editActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !editContent.trim()}>
              {saving ? '...' : <Check size={16} />}
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.cardContent}>{post.content}</p>
      )}
      {!editing && post.imageUrl && (
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
        <span className={`${styles.statBtn} ${styles.viewsBtn}`}>
          <Eye size={16} />
          <span>{post.viewsCount}</span>
          {post.viewersPreview.totalCount > 0 && (
            <div className={styles.viewersTooltip}>
              {post.viewersPreview.viewers.map((v) => (
                <span key={v.id} className={styles.viewerItem}>
                  {v.displayName}
                </span>
              ))}
              {post.viewersPreview.totalCount > 3 && (
                <span className={styles.viewerMore}>
                  {t('profile.and_more', { count: post.viewersPreview.totalCount - 3 })}
                </span>
              )}
            </div>
          )}
        </span>
        {post.createdAt !== post.updatedAt && (
          <span className={styles.editedBadge}>{t('profile.edited')}</span>
        )}
      </div>
    </div>
  );
}
