import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, X, Play, Star, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { moviesApi, type IaMovie } from '@/shared/api/movies.api';
import { Skeleton } from '@/shared/ui';
import { useMoviePlayer } from '@/shared/lib/MoviePlayerContext';
import styles from './MoviesPage.module.css';

export function MoviesPage() {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IaMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const player = useMoviePlayer();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setLoading(true);
    moviesApi.search(query.trim()).then(setResults).finally(() => setLoading(false));
  }, [query]);

  // Resolve video URL when currentMovie changes
  useEffect(() => {
    if (!player.currentMovie) {
      setVideoUrl(null);
      return;
    }
    setUrlLoading(true);
    setVideoUrl(null);
    moviesApi.getVideoUrl(player.currentMovie.identifier).then((url) => {
      setVideoUrl(url);
      setUrlLoading(false);
    });
  }, [player.currentMovie]);

  const openPlayer = useCallback((movie: IaMovie) => {
    player.playMovie(movie);
  }, [player]);

  const handleClose = useCallback(() => {
    player.stopMovie();
  }, [player]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{t('movies.title')}</h2>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('movies.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {loading && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton width="100%" height="17rem" borderRadius="8px" />
            <div className={styles.skeletonInfo}>
              <Skeleton width="80%" height={14} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && query.trim() && (
          <div className={styles.empty}>{t('movies.no_results')}</div>
        )}

        {!loading && !query.trim() && results.length === 0 && (
          <div className={styles.empty}>{t('movies.no_popular')}</div>
        )}

        {!loading && results.map((movie) => (
          <button key={movie.identifier} className={styles.card} onClick={() => openPlayer(movie)}>
            <div className={styles.posterWrap}>
              <img
                src={moviesApi.getThumbnail(movie.identifier)}
                alt={movie.title}
                className={styles.poster}
                loading="lazy"
              />
              <div className={styles.playOverlay}>
                <Play size={24} />
              </div>
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardTitle}>{movie.title}</span>
              <div className={styles.cardMeta}>
                {movie.avg_rating != null && (
                  <span className={styles.rating}>
                    <Star size={12} fill="currentColor" /> {movie.avg_rating.toFixed(1)}
                  </span>
                )}
                {movie.downloads != null && (
                  <span className={styles.downloads}>{t('movies.downloads', { count: movie.downloads })}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {player.currentMovie && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{player.currentMovie.title}</h3>
              <button className={styles.modalClose} onClick={handleClose}><X size={20} /></button>
            </div>
            {urlLoading ? (
              <div className={styles.player}>
                <div className={styles.loaderWrap}>
                  <Loader size={32} className={styles.spinner} />
                </div>
              </div>
            ) : videoUrl ? (
              <video
                ref={(el) => {
                  videoRef.current = el;
                  player.attachVideo(el);
                }}
                className={styles.player}
                src={videoUrl}
                controls
                onPlay={player.onPlay}
                onPause={player.onPause}
                onTimeUpdate={(e) => player.onTimeUpdate(e.currentTarget.currentTime)}
                onDurationChange={(e) => player.onDurationChange(e.currentTarget.duration)}
                onSeeked={(e) => player.onSeeked(e.currentTarget.currentTime)}
              />
            ) : (
              <div className={styles.player}>
                <div className={styles.loaderWrap}>{t('movies.failed_to_load')}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
