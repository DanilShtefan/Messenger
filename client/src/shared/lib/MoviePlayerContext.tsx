import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { connectSocket } from '@/shared/lib/socket';

interface MovieData {
  title: string;
  identifier: string;
}

interface MoviePlayerValue {
  currentMovie: MovieData | null;
  playing: boolean;
  position: number;
  duration: number;
  hostId: string | null;
  attachVideo: (el: HTMLVideoElement | null) => void;
  playMovie: (movie: MovieData) => void;
  stopMovie: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (dur: number) => void;
  joinSession: (hostId: string) => void;
  leaveSession: () => void;
}

const MoviePlayerContext = createContext<MoviePlayerValue | null>(null);

interface PendingCommand {
  seek?: number;
  play?: boolean;
}

export function MoviePlayerProvider({ children }: { children: ReactNode }) {
  const [currentMovie, setCurrentMovie] = useState<MovieData | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hostId, setHostId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hostRef = useRef(hostId);
  const playingRef = useRef(playing);
  const movieRef = useRef(currentMovie);
  const positionRef = useRef(position);
  const pendingRef = useRef<PendingCommand | null>(null);

  playingRef.current = playing;
  movieRef.current = currentMovie;
  positionRef.current = position;

  function emitSocket(event: string, data?: any) {
    connectSocket().emit(event, data);
  }

  function emitPlay(movie: MovieData) {
    emitSocket('movie:play', movie);
  }

  function emitStop() {
    emitSocket('movie:stop');
  }

  function emitSync(pos?: number) {
    const movie = movieRef.current;
    if (!movie) return;
    emitSocket('movie:sync', {
      title: movie.title,
      identifier: movie.identifier,
      position: pos ?? positionRef.current,
      playing: playingRef.current,
      timestamp: Date.now(),
    });
  }

  function controlVideo(seekTo: number, autoPlay: boolean) {
    const el = videoRef.current;
    if (el) {
      if (el.readyState >= 2) {
        el.currentTime = seekTo;
        if (autoPlay) el.play().catch(() => setPlaying(false));
        else el.pause();
      } else {
        el.addEventListener('loadedmetadata', () => {
          el.currentTime = seekTo;
          if (autoPlay) el.play().catch(() => setPlaying(false));
          else el.pause();
        }, { once: true });
      }
    } else {
      pendingRef.current = { seek: seekTo, play: autoPlay };
    }
  }

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && pendingRef.current) {
      const p = pendingRef.current;
      pendingRef.current = null;
      const apply = () => {
        if (p.seek != null) el.currentTime = p.seek;
        if (p.play) el.play().catch(() => setPlaying(false));
      };
      if (el.readyState >= 2) {
        apply();
      } else {
        el.addEventListener('loadedmetadata', apply, { once: true });
      }
    }
  }, []);

  // Socket listeners
  useEffect(() => {
    const socket = connectSocket();

    socket.on('movie:sync-state', (payload: { hostId: string; data: { title: string; identifier: string; position: number; playing: boolean; timestamp: number } | null }) => {
      if (hostRef.current !== payload.hostId || !payload.data) return;

      const data = payload.data;
      const elapsed = data.playing ? (Date.now() - data.timestamp) / 1000 : 0;
      const targetPos = Math.min(data.position + elapsed, Infinity);

      if (movieRef.current?.identifier === data.identifier && videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - targetPos) > 2) {
          videoRef.current.currentTime = targetPos;
        }
        if (data.playing && !playingRef.current) {
          videoRef.current.play().catch(() => {});
          setPlaying(true);
        } else if (!data.playing && playingRef.current) {
          videoRef.current.pause();
          setPlaying(false);
        }
      } else {
        setCurrentMovie({ title: data.title, identifier: data.identifier });
        setPlaying(data.playing);
        controlVideo(targetPos, data.playing);
      }
    });

    socket.on('movie:session-ended', (payload: { hostId: string }) => {
      if (hostRef.current === payload.hostId) {
        setHostId(null);
        hostRef.current = null;
      }
    });

    return () => {
      socket.off('movie:sync-state');
      socket.off('movie:session-ended');
    };
  }, []);

  function playMovie(movie: MovieData) {
    if (hostRef.current) return;

    setCurrentMovie(movie);
    setPlaying(true);
    setPosition(0);
    controlVideo(0, true);
    emitPlay(movie);
    emitSync(0);
  }

  function stopMovie() {
    const wasHost = !hostRef.current;
    setCurrentMovie(null);
    setPlaying(false);
    setPosition(0);
    if (wasHost) {
      emitStop();
      emitSync(0);
    } else {
      leaveSession();
    }
  }

  function togglePlay() {
    if (hostRef.current || !videoRef.current) return;

    if (playingRef.current) {
      videoRef.current.pause();
      setPlaying(false);
      playingRef.current = false;
      emitSync(videoRef.current.currentTime);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
      playingRef.current = true;
      emitSync(videoRef.current.currentTime);
    }
  }

  function seek(time: number) {
    if (hostRef.current || !videoRef.current) return;
    videoRef.current.currentTime = time;
    setPosition(time);
    positionRef.current = time;
    emitSync(time);
  }

  function onPlay() {
    if (hostRef.current) return;
    setPlaying(true);
    playingRef.current = true;
    if (videoRef.current) emitSync(videoRef.current.currentTime);
  }

  function onPause() {
    if (hostRef.current) return;
    setPlaying(false);
    playingRef.current = false;
    if (videoRef.current) emitSync(videoRef.current.currentTime);
  }

  function onTimeUpdate(time: number) {
    setPosition(time);
    positionRef.current = time;
  }

  function onDurationChange(dur: number) {
    setDuration(dur);
  }

  function joinSession(id: string) {
    setHostId(id);
    hostRef.current = id;
    emitSocket('movie:join', id);
  }

  function leaveSession() {
    setHostId(null);
    hostRef.current = null;
    emitSocket('movie:leave');
  }

  return (
    <MoviePlayerContext.Provider
      value={{
        currentMovie,
        playing,
        position,
        duration,
        hostId,
        attachVideo,
        playMovie,
        stopMovie,
        togglePlay,
        seek,
        onPlay,
        onPause,
        onTimeUpdate,
        onDurationChange,
        joinSession,
        leaveSession,
      }}
    >
      {children}
    </MoviePlayerContext.Provider>
  );
}

export function useMoviePlayer() {
  const ctx = useContext(MoviePlayerContext);
  if (!ctx) throw new Error('useMoviePlayer must be used within MoviePlayerProvider');
  return ctx;
}
