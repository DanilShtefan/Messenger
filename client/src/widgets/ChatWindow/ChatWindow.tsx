import { useEffect, useRef, useCallback, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, Pencil, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { connectSocket } from '@/shared/lib/socket';
import { useFetchMessages } from '@/shared/hooks/useFetchMessages';
import { useSendMessage } from '@/shared/hooks/useSendMessage';
import { useSocket } from '@/shared/hooks/useSocket';
import { useFetchChats } from '@/shared/hooks/useFetchChats';
import { chatsApi } from '@/shared/api/chats.api';
import { messagesApi } from '@/shared/api/messages.api';
import { useAppSelector } from '@/app/hooks';
import { formatDate } from '@/shared/lib/helpers';
import { Button, Avatar } from '@/shared/ui';
import type { Message } from '@/shared/types';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  dialogId: string;
  participantName: string;
  participantAvatar: string | null;
}

export function ChatWindow({ dialogId, participantName, participantAvatar }: ChatWindowProps) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const { messages, isLoading, loadMore, hasMore, addMessage, editMessage, markAsRead } = useFetchMessages(dialogId);
  const { send, isLoading: isSending } = useSendMessage();
  const { resetUnreadCount } = useFetchChats();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);

  useEffect(() => {
    chatsApi.markAsRead(dialogId).catch(() => {});
    markAsRead();
    resetUnreadCount(dialogId);
  }, [dialogId, markAsRead, resetUnreadCount]);

  useEffect(() => {
    const socket = connectSocket();
    const handler = (msg: Message) => {
      if (msg.dialogId === dialogId && msg.senderId !== currentUserId) {
        chatsApi.markAsRead(dialogId).catch(() => {});
      }
    };
    socket.on('message:new', handler);
    return () => { socket.off('message:new', handler); };
  }, [dialogId, currentUserId]);

  const onTypingStart = useCallback(
    (data: { dialogId: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setIsTyping(true);
      }
    },
    [currentUserId],
  );

  const onTypingStop = useCallback(
    (data: { dialogId: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setIsTyping(false);
      }
    },
    [currentUserId],
  );

  const onDialogRead = useCallback(
    (data: { dialogId: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        markAsRead();
      }
    },
    [currentUserId, markAsRead],
  );

  useSocket({ dialogId, onTypingStart, onTypingStop, onDialogRead });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const emitTyping = useCallback(() => {
    const socket = connectSocket();
    socket.emit('typing:start', dialogId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', dialogId);
    }, 2000);
  }, [dialogId]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    connectSocket().emit('typing:stop', dialogId);
  }, [dialogId]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;
    stopTyping();

    if (editingMsgId) {
      try {
        const result = await messagesApi.update(editingMsgId, content);
        editMessage(result.id, result.content, result.updatedAt);
        setEditingMsgId(null);
        setText('');
      } catch {}
    } else {
      setText('');
      try {
        const msg = await send({ content, dialogId });
        addMessage(msg);
      } catch {}
    }
  }, [text, editingMsgId, send, dialogId, addMessage, editMessage, stopTyping]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    handleSend();
  }, [handleSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleChange = useCallback((value: string) => {
    setText(value);
    emitTyping();
  }, [emitTyping]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0 && hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  function startEdit(msg: Message) {
    setEditingMsgId(msg.id);
    setText(msg.content);
  }

  function cancelEdit() {
    setEditingMsgId(null);
    setText('');
  }

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/chats')} type="button">
          <ArrowLeft size={20} />
        </button>
        <Avatar src={participantAvatar} name={participantName} size="sm" />
        <span className={styles.name}>{participantName}</span>
      </header>

      <div className={styles.messages} ref={containerRef} onScroll={handleScroll}>
        {isLoading && (
          <div className={styles.loading}>Loading messages...</div>
        )}

        {hasMore && (
          <button className={styles.loadMore} onClick={loadMore} type="button">
            Load earlier messages
          </button>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`${styles.message} ${isMine ? styles.mine : styles.theirs}`}
            >
              <div className={styles.bubble}>
                <p className={styles.text}>{msg.content}</p>
                <span className={styles.time}>
                  {msg.createdAt !== msg.updatedAt && (
                    <span className={styles.edited}>{t('edited')}</span>
                  )}
                  {formatDate(msg.createdAt)}
                  {isMine && (
                    msg.readAt
                      ? <CheckCheck size={14} className={styles.readIcon} />
                      : <Check size={14} className={styles.readIcon} />
                  )}
                </span>
              </div>
              {isMine && (
                <button className={styles.editMsgBtn} onClick={() => startEdit(msg)} title="Edit">
                  <Pencil size={12} />
                </button>
              )}
            </div>
          );
        })}
        {isTyping && (
          <div className={styles.typingIndicator}>
            <span className={styles.typingDots}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
            </span>
            <span className={styles.typingText}>{t('typing')}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          placeholder={editingMsgId ? t('edit_message') : t('type_message')}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        {editingMsgId && (
          <button className={styles.cancelEditBtn} onClick={cancelEdit} type="button" title="Cancel">
            <X size={18} />
          </button>
        )}
        <Button type="submit" isLoading={isSending} disabled={!text.trim()}>
          {editingMsgId ? t('save') : t('send')}
        </Button>
      </form>
    </div>
  );
}
