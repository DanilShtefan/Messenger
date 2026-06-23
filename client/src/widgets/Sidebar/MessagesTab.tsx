import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connectSocket } from '@/shared/lib/socket';
import { useFetchChats } from '@/shared/hooks/useFetchChats';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Skeleton } from '@/shared/ui';
import { formatDate, cn } from '@/shared/lib/helpers';
import type { Message } from '@/shared/types';
import styles from './Sidebar.module.css';

export const MessagesTab = memo(function MessagesTab() {
  const { t } = useTranslation('chat');
  const { dialogId } = useParams();
  const navigate = useNavigate();
  const { chats, isLoading, updateChatLastMessage, incrementUnread } = useFetchChats();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const { isOnline } = useOnlineStatus();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const socket = connectSocket();

    function handleMessage(msg: Message) {
      updateChatLastMessage(msg.dialogId, msg.content, msg.createdAt);
      if (msg.senderId !== currentUserId) {
        incrementUnread(msg.dialogId);
      }
    }

    socket.on('message:new', handleMessage);
    return () => { socket.off('message:new', handleMessage); };
  }, [updateChatLastMessage, incrementUnread, currentUserId]);

  const joinedIds = useRef(new Set<string>());

  useEffect(() => {
    const socket = connectSocket();
    for (const chat of chats) {
      if (!joinedIds.current.has(chat.id)) {
        joinedIds.current.add(chat.id);
        socket.emit('join:dialog', chat.id);
      }
    }
  }, [chats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) => c.participant?.displayName.toLowerCase().includes(q));
  }, [chats, search]);

  const list = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton width={40} height={40} borderRadius="50%" />
          <div className={styles.skeletonText}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ));
    }

    if (filtered.length === 0) {
      return <div className={styles.empty}>No chats yet</div>;
    }

    return filtered.map((chat) => {
      const participant = chat.participant;
      if (!participant) return null;
      const isActive = chat.id === dialogId;
      const isMe = participant.id === currentUserId;

      return (
        <button
          key={chat.id}
          className={cn(styles.row, isActive && styles.rowActive)}
          onClick={() => navigate(`/chats/${chat.id}`)}
        >
          <div className={styles.avatarWrap}>
            <Avatar
              src={participant.avatarUrl}
              name={participant.displayName}
              size="md"
            />
            {isOnline(participant.id) && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.info}>
            <div className={styles.top}>
              <span className={styles.name}>
                {isMe ? 'Saved Messages' : participant.displayName}
              </span>
              {chat.lastMessage && (
                <span className={styles.time}>
                  {formatDate(chat.lastMessage.createdAt)}
                </span>
              )}
            </div>
            <div className={styles.bottom}>
              <span className={styles.preview}>
                {chat.lastMessage?.content ?? 'No messages yet'}
              </span>
              {chat.unreadCount > 0 && (
                <span className={styles.badge}>{chat.unreadCount}</span>
              )}
            </div>
          </div>
        </button>
      );
    });
  }, [isLoading, filtered, dialogId, currentUserId, navigate, isOnline]);

  return (
    <>
      <div className={styles.search}>
        <input
          className={styles.searchInput}
          placeholder={t('search_chats')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>{list}</div>
    </>
  );
});
