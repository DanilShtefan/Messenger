import { useEffect, useState, useCallback } from 'react';
import { Search, X, Play, Star } from 'lucide-react';
import { moviesApi, type IaMovie } from '@/shared/api/movies.api';
import { Skeleton } from '@/shared/ui';
import { connectSocket } from '@/shared/lib/socket';
import styles from './MoviesPage.module.css';

export function MoviesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IaMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IaMovie | null>(null);

  useEffect(() => {
    setLoading(true);
    moviesApi.search(query.trim()).then(setResults).finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const socket = connectSocket();
    if (selected) {
      socket.emit('movie:play', { title: selected.title, identifier: selected.identifier });
    } else {
      socket.emit('movie:stop');
    }
  }, [selected]);

  useEffect(() => {
    return () => {
      const socket = connectSocket();
      socket.emit('movie:stop');
    };
  }, []);

  const openPlayer = useCallback((movie: IaMovie) => {
    setSelected(movie);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Public Domain Movies</h2>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search movies..."
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
          <div className={styles.empty}>No movies found</div>
        )}

        {!loading && !query.trim() && results.length === 0 && (
          <div className={styles.empty}>No popular movies found</div>
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
                  <span className={styles.downloads}>{movie.downloads.toLocaleString()} downloads</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{selected.title}</h3>
              <button className={styles.modalClose} onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <iframe
              className={styles.player}
              src={moviesApi.getEmbedUrl(selected.identifier)}
              allow="fullscreen"
              title={selected.title}
            />
            {selected.description && (
              <p className={styles.description}>{selected.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
