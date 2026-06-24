import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Reply, X, Trash2 } from 'lucide-react';
import { Avatar, Button } from '@/shared/ui';
import { commentsApi } from '@/shared/api/comments.api';
import { connectSocket } from '@/shared/lib/socket';
import { useAppSelector } from '@/app/hooks';
import { cn, formatPostDate } from '@/shared/lib/helpers';
import type { Comment, CommentsResponse } from '@/shared/types';
import styles from './ProfilePosts.module.css';

interface Props {
  postId: string;
  commentCount: number;
  isOwn: boolean;
}

export function CommentSection({ postId, commentCount: initialCount }: Props) {
  const { t } = useTranslation('common');
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    commentsApi.getByPost(postId).then((res: CommentsResponse) => {
      setComments(res.comments);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [postId, open]);

  useEffect(() => {
    const socket = connectSocket();

    function handleNew(data: { postId: string; comment: Comment }) {
      if (data.postId !== postId) return;
      setComments((prev) => {
        if (!data.comment.parentId) return [data.comment, ...prev];

        const parentInTop = prev.find((c) => c.id === data.comment.parentId);
        if (parentInTop) {
          return prev.map((c) =>
            c.id === data.comment.parentId
              ? { ...c, replies: [...c.replies, data.comment] }
              : c,
          );
        }

        return prev.map((c) =>
          c.replies.some((r) => r.id === data.comment.parentId)
            ? { ...c, replies: [...c.replies, data.comment] }
            : c,
        );
      });
      setCount((c) => c + 1);
    }

    function handleDeleted(data: { postId: string; commentId: string }) {
      if (data.postId !== postId) return;
      setComments((prev) => {
        const filtered = prev.filter((c) => c.id !== data.commentId);
        const withRemovedReplies = filtered.map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== data.commentId),
        }));
        return withRemovedReplies;
      });
      setCount((c) => Math.max(0, c - 1));
    }

    socket.on('post:comment', handleNew);
    socket.on('post:comment:deleted', handleDeleted);
    return () => {
      socket.off('post:comment', handleNew);
      socket.off('post:comment:deleted', handleDeleted);
    };
  }, [postId]);

  const handleSubmit = useCallback(async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      await commentsApi.create(postId, { content, parentId: replyingTo });
      setText('');
      setReplyingTo(null);
    } catch {} finally {
      setSending(false);
    }
  }, [text, postId, replyingTo]);

  const handleDelete = useCallback(async (commentId: string) => {
    try {
      await commentsApi.delete(commentId);
    } catch {}
  }, []);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  function renderComment(c: Comment, isReply = false) {
    const isMine = c.authorId === currentUserId;
    return (
      <div key={c.id} className={cn(styles.commentItem, isReply && styles.commentReply)}>
        <Avatar src={c.author.avatarUrl} name={c.author.displayName} size="xs" />
        <div className={styles.commentBody}>
          <div className={styles.commentHeader}>
            <span className={styles.commentAuthor}>{c.author.displayName}</span>
            <span className={styles.commentTime}>{formatPostDate(c.createdAt)}</span>
          </div>
          <p className={styles.commentText}>{c.content}</p>
          <div className={styles.commentActions}>
            <button
              className={styles.commentActionBtn}
              onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
            >
              <Reply size={12} />
              <span>{t('profile.reply')}</span>
            </button>
            {isMine && (
              <button className={styles.commentActionBtn} onClick={() => handleDelete(c.id)}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
          {!isReply && c.replies.length > 0 && (
            <div className={styles.commentReplies}>
              {c.replies.map((r) => renderComment(r, true))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.commentSection}>
      <button
        className={cn(styles.commentToggle, open && styles.commentToggleOpen)}
        onClick={() => setOpen(!open)}
      >
        <MessageCircle size={15} />
        <span>{t('profile.comments', { count })}</span>
      </button>

      {open && (
        <div className={styles.commentContent}>
          {loading && <div className={styles.commentLoading}>Loading...</div>}

          {!loading && comments.length === 0 && (
            <div className={styles.commentEmpty}>No comments yet</div>
          )}

          {comments.map((c) => renderComment(c))}

          <div className={styles.commentInputWrap}>
            {replyingTo && (
              <div className={styles.replyIndicator}>
                <Reply size={12} />
                <span>{t('profile.replying_to')}</span>
                <button className={styles.replyCancel} onClick={() => setReplyingTo(null)}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div className={styles.commentInputRow}>
              <input
                ref={inputRef}
                className={styles.commentInput}
                placeholder={t('profile.write_comment')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              />
              <Button size="sm" disabled={!text.trim()} isLoading={sending} onClick={handleSubmit}>
                {t('button.send')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
