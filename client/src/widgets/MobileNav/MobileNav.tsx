import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Newspaper, MessageSquare, Users, Grid3X3, Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { connectSocket } from '@/shared/lib/socket';
import { friendsApi } from '@/shared/api/friends.api';
import { useMusicPlayer } from '@/shared/lib/MusicPlayerContext';
import { useAppSelector } from '@/app/hooks';
import { cn } from '@/shared/lib/helpers';
import { SettingsDrawer } from '@/widgets/SettingsDrawer/SettingsDrawer';
import { MobileMoreSheet } from './MobileMoreSheet';
import styles from './MobileNav.module.css';

export function MobileNav() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.user.currentUser);
  const player = useMusicPlayer();
  const [incomingCount, setIncomingCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  useEffect(() => {
    document.documentElement.style.setProperty('--player-height', player.currentTrack ? '3.5rem' : '0rem');
  }, [player.currentTrack]);

  const isActive = (path: string) => {
    if (path === '/chats') return location.pathname.startsWith('/chats');
    return location.pathname === path;
  };

  const isMoreActive = () => {
    const morePaths = ['/music', '/movies', '/games'];
    if (user && location.pathname === `/profile/${user.id}`) return true;
    return morePaths.some(p => location.pathname === p || location.pathname.startsWith(p));
  };

  return (
    <>
      {player.currentTrack && (
        <div className={styles.player}>
          <div className={styles.playerProgress}>
            <div
              className={styles.playerProgressFill}
              style={{ width: `${(player.progress / (player.duration || 30)) * 100}%` }}
            />
          </div>
          <div className={styles.playerTrack}>
            <img
              src={player.currentTrack.album.cover_small}
              alt=""
              className={styles.playerCover}
            />
            <div className={styles.playerInfo}>
              <span className={styles.playerTitle}>{player.currentTrack.title}</span>
              <span className={styles.playerArtist}>{player.currentTrack.artist.name}</span>
            </div>
          </div>
          <div className={styles.playerControls}>
            <button className={styles.playerCloseBtn} onClick={player.stop} aria-label="Close player">
              <X size={16} />
            </button>
            <button className={styles.playerBtn} onClick={player.prev}>
              <SkipBack size={16} />
            </button>
            <button className={styles.playerBtn} onClick={player.togglePlay}>
              {player.playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className={styles.playerBtn} onClick={player.next}>
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        <button
          className={cn(styles.tab, isActive('/feed') && styles.tabActive)}
          onClick={() => navigate('/feed')}
        >
          <Newspaper size={20} />
          <span className={styles.tabLabel}>{t('navigation.feed')}</span>
        </button>

        <button
          className={cn(styles.tab, isActive('/chats') && styles.tabActive)}
          onClick={() => navigate('/chats')}
        >
          <MessageSquare size={20} />
          <span className={styles.tabLabel}>{t('navigation.chats')}</span>
        </button>

        <button
          className={cn(styles.tab, isActive('/friends') && styles.tabActive)}
          onClick={() => navigate('/friends')}
        >
          <Users size={20} />
          <span className={styles.tabLabel}>{t('navigation.friends')}</span>
          {incomingCount > 0 && <span className={styles.tabBadge}>{incomingCount}</span>}
        </button>

        <button
          className={cn(styles.tab, isMoreActive() && styles.tabActive)}
          onClick={() => setMoreOpen(true)}
        >
          <Grid3X3 size={20} />
          <span className={styles.tabLabel}>{t('navigation.more')}</span>
        </button>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
