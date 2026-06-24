import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { GroupCreateModal } from './GroupCreateModal';
import { useFetchChats } from '@/shared/hooks/useFetchChats';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Skeleton } from '@/shared/ui';
import { formatDate, cn } from '@/shared/lib/helpers';
import styles from './Sidebar.module.css';

export function MessagesTab() {
  const { t } = useTranslation('chat');
  const { dialogId } = useParams();
  const navigate = useNavigate();
  const { chats, isLoading } = useFetchChats();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const { isOnline } = useOnlineStatus();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return chats;
    const q = debouncedSearch.toLowerCase();
    return chats.filter((c) => {
      const name = c.name || c.participant?.displayName || '';
      return name.toLowerCase().includes(q);
    });
  }, [chats, debouncedSearch]);

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
      const isActive = chat.id === dialogId;
      const chatName = chat.name || participant?.displayName || 'Unknown';
      const avatarUrl = participant?.avatarUrl ?? null;
      const isMe = participant?.id === currentUserId;
      const isGroup = !!chat.name;

      return (
        <button
          key={chat.id}
          className={cn(styles.row, isActive && styles.rowActive)}
          onClick={() => navigate(`/chats/${chat.id}`)}
        >
          <div className={styles.avatarWrap}>
            <Avatar
              src={avatarUrl}
              name={chatName}
              size="md"
            />
            {!isGroup && participant && isOnline(participant.id) && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.info}>
            <div className={styles.top}>
              <span className={styles.name}>
                {isMe && !isGroup ? 'Saved Messages' : chatName}
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
      <div className={styles.groupHeader}>
        <button className={styles.createGroupBtn} onClick={() => setShowGroupModal(true)}>
          <Users size={16} />
          <span>{t('create_group')}</span>
        </button>
      </div>

      <div className={styles.search}>
        <input
          className={styles.searchInput}
          placeholder={t('search_chats')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>{list}</div>

      {showGroupModal && (
        <GroupCreateModal onClose={() => setShowGroupModal(false)} />
      )}
    </>
  );
}
