import { useState, useRef, useCallback } from 'react';
import { Image, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { postsApi } from '@/shared/api/posts.api';
import { Button } from '@/shared/ui';
import type { Post } from '@/shared/types';
import styles from './ProfilePosts.module.css';

interface PostInputProps {
  onPostCreated: (post: Post) => void;
}

export function PostInput({ onPostCreated }: PostInputProps) {
  const { t } = useTranslation('common');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [preview]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !image) return;
    setSending(true);
    try {
      const post = await postsApi.create({ content: content.trim(), image: image ?? undefined });
      onPostCreated(post);
      setContent('');
      clearImage();
    } catch {
    } finally {
      setSending(false);
    }
  }, [content, image, onPostCreated, clearImage]);

  return (
    <div className={styles.inputWrap}>
      <textarea
        className={styles.textarea}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={1000}
      />
      {preview && (
        <div className={styles.previewWrap}>
          <img src={preview} alt="" className={styles.preview} />
          <button className={styles.removeImage} onClick={clearImage} type="button"><X size={14} /></button>
        </div>
      )}
      <div className={styles.inputActions}>
        <button className={styles.imageBtn} onClick={() => fileRef.current?.click()} type="button">
          <Image size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className={styles.fileInput}
          onChange={handleImageSelect}
        />
        <Button onClick={handleSubmit} isLoading={sending} disabled={!content.trim() && !image}>
          {t('button.send')}
        </Button>
      </div>
    </div>
  );
}
