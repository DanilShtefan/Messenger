import { useEffect, useRef, useCallback, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, Pencil, X, Forward, SmilePlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { connectSocket } from '@/shared/lib/socket';
import { useFetchMessages } from '@/shared/hooks/useFetchMessages';
import { useSendMessage } from '@/shared/hooks/useSendMessage';
import { useSocket } from '@/shared/hooks/useSocket';
import { useFetchChats } from '@/shared/hooks/useFetchChats';
import { chatsApi } from '@/shared/api/chats.api';
import { messagesApi } from '@/shared/api/messages.api';
import { useAppSelector } from '@/app/hooks';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { formatDate } from '@/shared/lib/helpers';
import { Button, Avatar } from '@/shared/ui';
import type { Message } from '@/shared/types';
import styles from './ChatWindow.module.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

interface ChatWindowProps {
  dialogId: string;
  participantName: string;
  participantAvatar: string | null;
  isGroup?: boolean;
  groupName?: string | null;
}

export function ChatWindow({ dialogId, participantName, participantAvatar, isGroup, groupName }: ChatWindowProps) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const { messages, isLoading, loadMore, hasMore, addMessage, editMessage, markAsRead } = useFetchMessages(dialogId);
  const { send, isLoading: isSending } = useSendMessage();
  const { chats, resetUnreadCount } = useFetchChats();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const { isOnline } = useOnlineStatus();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const currentDialog = chats.find((c) => c.id === dialogId);

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

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    try {
      await messagesApi.react(messageId, emoji);
    } catch {}
  }, []);

  function startForward(msg: Message) {
    setForwardingMsg(msg);
    setShowForwardModal(true);
  }

  const handleForwardSend = useCallback(async (targetDialogId: string) => {
    if (!forwardingMsg) return;
    try {
      const senderName = forwardingMsg.sender?.displayName ?? participantName;
      await messagesApi.send({
        content: forwardingMsg.content,
        dialogId: targetDialogId,
        forwardedFrom: { senderName, content: forwardingMsg.content, senderId: forwardingMsg.senderId },
      });
      setShowForwardModal(false);
      setForwardingMsg(null);
    } catch {}
  }, [forwardingMsg, participantName]);

  const headerName = isGroup && groupName ? groupName : participantName;

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/chats')} type="button">
          <ArrowLeft size={20} />
        </button>
        <button
          className={styles.headerInfo}
          onClick={() => {
            if (isGroup) {
              setShowParticipants(true);
            } else if (currentDialog?.participant) {
              navigate(`/profile/${currentDialog.participant.id}`);
            }
          }}
          type="button"
        >
          <div className={styles.avatarWrap}>
            <Avatar src={participantAvatar} name={headerName} size="sm" />
            {!isGroup && currentDialog?.participant && isOnline(currentDialog.participant.id) && (
              <span className={styles.onlineDot} />
            )}
          </div>
          <div className={styles.headerText}>
            <span className={styles.name}>{headerName}</span>
            {isGroup && currentDialog?.participants && (
              <span className={styles.memberCount}>
                {currentDialog.participants.length} members
              </span>
            )}
          </div>
        </button>
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
          const reactions = msg.reactions ?? {};
          const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);
          const reactedByMe = (emoji: string) => reactions[emoji]?.includes(currentUserId ?? '');
          const showSender = isGroup && !isMine;
          return (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}
            >
              {showSender && (
                <button
                  className={styles.msgAvatar}
                  onClick={() => navigate(`/profile/${msg.senderId}`)}
                >
                  <Avatar src={msg.sender?.avatarUrl ?? null} name={msg.sender?.displayName ?? ''} size="sm" />
                  {isOnline(msg.senderId) && <span className={styles.onlineDot} />}
                </button>
              )}
              <div className={styles.msgContent}>
                {showSender && (
                  <span className={styles.msgSenderName}>{msg.sender?.displayName}</span>
                )}
                <div className={`${styles.message} ${isMine ? styles.mine : styles.theirs}`}>
                  <div className={styles.bubble}>
                    {msg.forwardedFrom && (
                      <div className={styles.forwardedHeader}>
                        <Forward size={11} className={styles.forwardIcon} />
                        <button
                          className={styles.forwardedName}
                          onClick={() => navigate(`/profile/${msg.forwardedFrom!.senderId}`)}
                        >
                          {t('forwarded_from', { name: msg.forwardedFrom.senderName })}
                        </button>
                      </div>
                    )}
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
                  {reactionEntries.length > 0 && (
                    <div className={styles.reactions}>
                      {reactionEntries.map(([emoji, users]) => (
                        <button
                          key={emoji}
                          className={`${styles.reactionBadge} ${reactedByMe(emoji) ? styles.reactionActive : ''}`}
                          onClick={() => handleReact(msg.id, emoji)}
                        >
                          {emoji} {users.length}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.msgActions}>
                <div className={styles.msgActionsInner}>
                  <button
                    className={styles.msgActionBtn}
                    onClick={() => setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id)}
                    title="React"
                  >
                    <SmilePlus size={14} />
                  </button>
                  <button
                    className={styles.msgActionBtn}
                    onClick={() => startForward(msg)}
                    title="Forward"
                  >
                    <Forward size={14} />
                  </button>
                  {isMine && (
                    <button className={styles.msgActionBtn} onClick={() => startEdit(msg)} title="Edit">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
                {showEmojiFor === msg.id && (
                  <div className={styles.emojiPicker}>
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className={`${styles.emojiOption} ${reactedByMe(emoji) ? styles.emojiActive : ''}`}
                        onClick={() => { handleReact(msg.id, emoji); setShowEmojiFor(null); }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

      {showParticipants && currentDialog?.participants && (
        <div className={styles.modalOverlay} onClick={() => setShowParticipants(false)}>
          <div className={styles.participantsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.participantsModalHeader}>
              <Users size={18} />
              <span>{currentDialog.participants.length} members</span>
            </div>
            <div className={styles.participantsList}>
              {currentDialog.participants.map((p) => (
                <button
                  key={p.userId}
                  className={styles.participantRow}
                  onClick={() => { navigate(`/profile/${p.user.id}`); setShowParticipants(false); }}
                >
                  <Avatar src={p.user.avatarUrl} name={p.user.displayName} size="sm" />
                  <span className={styles.participantName}>{p.user.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className={styles.modalOverlay} onClick={() => setShowForwardModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('forward_to')}</h3>
            <div className={styles.forwardList}>
              {chats
                .filter((c) => c.id !== dialogId)
                .map((chat) => {
                  const chatName = chat.name || chat.participant?.displayName || 'Chat';
                  return (
                    <button
                      key={chat.id}
                      className={styles.forwardItem}
                      onClick={() => handleForwardSend(chat.id)}
                    >
                      <Avatar
                        src={chat.participant?.avatarUrl}
                        name={chatName}
                        size="sm"
                      />
                      <span>{chatName}</span>
                    </button>
                  );
                })}
            </div>
            <Button variant="ghost" onClick={() => setShowForwardModal(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
