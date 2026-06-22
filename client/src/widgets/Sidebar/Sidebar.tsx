import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Users } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { connectSocket } from '@/shared/lib/socket';
import { friendsApi } from '@/shared/api/friends.api';
import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/lib/helpers';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.user.currentUser);
  const [incomingCount, setIncomingCount] = useState(0);

  const fetchCount = useCallback(() => {
    friendsApi.getIncoming().then((r) => setIncomingCount(r.length)).catch(() => {});
  }, []);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('friend:request', fetchCount);
    socket.on('friend:accept', fetchCount);
    socket.on('friend:reject', fetchCount);
    return () => {
      socket.off('friend:request', fetchCount);
      socket.off('friend:accept', fetchCount);
      socket.off('friend:reject', fetchCount);
    };
  }, [fetchCount]);

  const isActive = (path: string) => {
    if (path === '/chats') return location.pathname.startsWith('/chats');
    return location.pathname === path;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <button
          className={cn(styles.navItem, isActive(`/profile/${user?.id}`) && styles.active)}
          onClick={() => user && navigate(`/profile/${user.id}`)}
        >
          <Avatar src={user?.avatarUrl ?? null} name={user?.displayName ?? '?'} size="sm" />
          <span className={styles.navLabel}>{user?.displayName ?? 'Profile'}</span>
        </button>
      </div>

      <div className={styles.section}>
        <button
          className={cn(styles.navItem, isActive('/chats') && styles.active)}
          onClick={() => navigate('/chats')}
        >
          <MessageSquare size={20} className={styles.navIcon} />
          <span className={styles.navLabel}>Messages</span>
        </button>
      </div>

      <div className={styles.section}>
        <button
          className={cn(styles.navItem, isActive('/friends') && styles.active)}
          onClick={() => navigate('/friends')}
        >
          <Users size={20} className={styles.navIcon} />
          <span className={styles.navLabel}>Friends</span>
          {incomingCount > 0 && <span className={styles.navBadge}>{incomingCount}</span>}
        </button>
      </div>
    </aside>
  );
}
