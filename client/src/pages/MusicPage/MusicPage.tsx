import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { musicApi } from '@/shared/api/music.api';
import { useMusicPlayer } from '@/shared/lib/MusicPlayerContext';
import { Skeleton } from '@/shared/ui';
import styles from './MusicPage.module.css';

export function MusicPage() {
  const { t } = useTranslation('common');
  const { currentTrack, playing, tracks, setTracks, play } = useMusicPlayer();

  useEffect(() => {
    if (tracks.length === 0) {
      musicApi.getChart().then(setTracks);
    }
  }, [tracks.length, setTracks]);

  return (
    <div className={styles.page}>
      <div className={styles.trackList}>
        <h2 className={styles.heading}>{t('music.popular_tracks')}</h2>

        {tracks.length === 0 && (
          <div className={styles.list}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton width={40} height={40} borderRadius="4px" />
                <div className={styles.skeletonInfo}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tracks.length > 0 && (
          <div className={styles.list}>
            {tracks.map((track) => (
              <button
                key={track.id}
                className={`${styles.trackRow} ${currentTrack?.id === track.id ? styles.trackRowActive : ''}`}
                onClick={() => play(track)}
              >
                <img
                  src={track.album.cover_small}
                  alt=""
                  className={styles.trackCover}
                />
                <div className={styles.trackInfo}>
                  <span className={styles.trackTitle}>{track.title}</span>
                  <span className={styles.trackArtist}>{track.artist.name}</span>
                </div>
                {currentTrack?.id === track.id && playing && (
                  <span className={styles.playingIndicator}>♫</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
