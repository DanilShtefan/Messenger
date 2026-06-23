import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Music, Film, Users, Settings, LogOut, Play, Pause, SkipBack, SkipForward, Volume2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { connectSocket } from '@/shared/lib/socket';
import { friendsApi } from '@/shared/api/friends.api';
import { useMusicPlayer } from '@/shared/lib/MusicPlayerContext';
import { useLogout } from '@/shared/hooks/useLogout';
import { SettingsDrawer } from '@/widgets/SettingsDrawer/SettingsDrawer';
import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/lib/helpers';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.user.currentUser);
  const [incomingCount, setIncomingCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const player = useMusicPlayer();
  const logout = useLogout();

  const fetchCount = useCallback(() => {
    friendsApi.getIncoming().then((r) => setIncomingCount(r.length)).catch(() => {});
  }, []);
  const [listenerCount, setListenerCount] = useState(0);
  const [movieListenerCount, setMovieListenerCount] = useState(0);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('friend:request', fetchCount);
    socket.on('friend:accept', fetchCount);
    socket.on('friend:reject', fetchCount);

    socket.on('session:listeners', (p: { hostId: string; count: number }) => {
      if (user && p.hostId === user.id) setListenerCount(p.count);
    });

    socket.on('movie:listeners', (p: { hostId: string; count: number }) => {
      if (user && p.hostId === user.id) setMovieListenerCount(p.count);
    });

    return () => {
      socket.off('friend:request', fetchCount);
      socket.off('friend:accept', fetchCount);
      socket.off('friend:reject', fetchCount);
      socket.off('session:listeners');
      socket.off('movie:listeners');
    };
  }, [fetchCount, user]);

  const isActive = (path: string) => {
    if (path === '/chats') return location.pathname.startsWith('/chats');
    return location.pathname === path;
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.nav}>
        <div className={styles.section}>
          <button
            className={cn(styles.navItem, isActive(`/profile/${user?.id}`) && styles.active)}
            onClick={() => user && navigate(`/profile/${user.id}`)}
          >
            <Avatar src={user?.avatarUrl ?? null} name={user?.displayName ?? '?'} size="sm" />
            <span className={styles.navLabel}>{user?.displayName ?? t('navigation.profile')}</span>
          </button>
        </div>

        <div className={styles.section}>
          <button
            className={cn(styles.navItem, isActive('/chats') && styles.active)}
            onClick={() => navigate('/chats')}
          >
            <MessageSquare size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('navigation.chats')}</span>
          </button>
        </div>

        <div className={styles.section}>
          <button
            className={cn(styles.navItem, isActive('/friends') && styles.active)}
            onClick={() => navigate('/friends')}
          >
            <Users size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('navigation.friends')}</span>
            {incomingCount > 0 && <span className={styles.navBadge}>{incomingCount}</span>}
          </button>
        </div>

        <div className={styles.section}>
          <button
            className={cn(styles.navItem, isActive('/music') && styles.active)}
            onClick={() => navigate('/music')}
          >
            <Music size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('navigation.music')}</span>
            {listenerCount > 0 && <span className={styles.navBadge}>{listenerCount}</span>}
          </button>
        </div>

        <div className={styles.section}>
          <button
            className={cn(styles.navItem, isActive('/movies') && styles.active)}
            onClick={() => navigate('/movies')}
          >
            <Film size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('navigation.movies')}</span>
            {movieListenerCount > 0 && <span className={styles.navBadge}>{movieListenerCount}</span>}
          </button>
        </div>

        <div className={styles.spacer} />

        <div className={styles.section}>
          <button className={styles.navItem} onClick={() => setSettingsOpen(true)}>
            <Settings size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('settings.title')}</span>
          </button>
        </div>

        <div className={styles.section}>
          <button className={styles.navItem} onClick={() => logout().then(() => navigate('/login'))}>
            <LogOut size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('button.logout')}</span>
          </button>
        </div>

        <div className={styles.section}>
          <button className={cn(styles.navItem, styles.languageToggle)} onClick={toggleLanguage}>
            <Globe size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('settings.language')}</span>
            <span className={styles.languageIndicator}>
              {i18n.language === 'en' ? 'EN' : 'RU'}
            </span>
          </button>
        </div>
      </div>

      {player.hostId && (
        <div className={styles.sessionBadge}>
          <Music size={12} />
          <span>{t('session.listening_with_friend')}</span>
          <button className={styles.leaveSessionBtn} onClick={player.leaveSession}>{t('session.leave_session')}</button>
        </div>
      )}

      {player.currentTrack && (
        <div className={styles.miniPlayer}>
          <div className={styles.miniTrack}>
            <img
              src={player.currentTrack.album.cover_small}
              alt=""
              className={styles.miniCover}
            />
            <div className={styles.miniInfo}>
              <span className={styles.miniTitle}>{player.currentTrack.title}</span>
              <span className={styles.miniArtist}>{player.currentTrack.artist.name}</span>
            </div>
          </div>

          <div className={styles.miniControls}>
            <button className={styles.miniBtn} onClick={player.prev}>
              <SkipBack size={14} />
            </button>
            <button className={styles.miniBtn} onClick={player.togglePlay}>
              {player.playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button className={styles.miniBtn} onClick={player.next}>
              <SkipForward size={14} />
            </button>
            <div className={styles.miniVolume}>
              <Volume2 size={12} />
              <input
                type="range"
                className={styles.miniVolumeSlider}
                min={0}
                max={1}
                step={0.05}
                value={player.volume}
                onChange={(e) => player.setVolume(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.miniProgress}>
            <div
              className={styles.miniProgressFill}
              style={{ width: `${(player.progress / (player.duration || 30)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
