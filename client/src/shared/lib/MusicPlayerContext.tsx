import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { DeezerTrack } from '@/shared/api/music.api';
import { connectSocket } from '@/shared/lib/socket';

interface SyncTrack {
  id: number;
  title: string;
  artist: string;
  cover: string;
  preview: string;
  duration: number;
}

interface SyncData {
  track: SyncTrack | null;
  position: number;
  playing: boolean;
  timestamp: number;
  index: number;
}

interface MusicPlayerContextValue {
  currentTrack: DeezerTrack | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  tracks: DeezerTrack[];
  setTracks: (tracks: DeezerTrack[]) => void;
  play: (track: DeezerTrack) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  hostId: string | null;
  joinSession: (hostId: string) => void;
  leaveSession: () => void;
  stop: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

function toSyncTrack(t: DeezerTrack): SyncTrack {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist.name,
    cover: t.album.cover_medium,
    preview: t.preview,
    duration: t.duration,
  };
}

function fromSyncTrack(t: SyncTrack): DeezerTrack {
  return {
    id: t.id,
    title: t.title,
    artist: { name: t.artist },
    album: { cover_medium: t.cover, cover_small: t.cover },
    preview: t.preview,
    duration: t.duration,
  };
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<DeezerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? Number(saved) : 1;
  });
  const [tracks, setTracksState] = useState<DeezerTrack[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(volume);
  const tracksRef = useRef(tracks);
  const hostRef = useRef(hostId);
  const progressRef = useRef(progress);
  const playingRef = useRef(playing);
  const trackRef = useRef(currentTrack);
  const lastTimeRef = useRef(0);
  tracksRef.current = tracks;
  progressRef.current = progress;
  playingRef.current = playing;
  trackRef.current = currentTrack;

  function emitPlay(track: DeezerTrack) {
    const s = connectSocket();
    s.emit('music:play', {
      title: track.title,
      artist: track.artist.name,
      cover: track.album.cover_medium,
    });
  }

  function emitStop() {
    connectSocket().emit('music:stop');
  }

  function emitSync(pos?: number) {
    const track = trackRef.current;
    if (!track) return;
    const idx = tracksRef.current.findIndex((t) => t.id === track.id);
    connectSocket().emit('music:sync', {
      track: toSyncTrack(track),
      position: pos ?? progressRef.current,
      playing: playingRef.current,
      timestamp: Date.now(),
      index: idx >= 0 ? idx : 0,
    });
  }

  function loadAudio(track: DeezerTrack, startPos: number, autoPlay: boolean) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(track.preview);
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      audio.currentTime = Math.min(startPos, audio.duration);
      setProgress(audio.currentTime);
      if (autoPlay) {
        audio.play().catch(() => setPlaying(false));
      }
    });

    audio.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastTimeRef.current > 250) {
        lastTimeRef.current = now;
        setProgress(audio.currentTime);
      }
    });

    audio.addEventListener('ended', () => {
      const list = tracksRef.current;
      const idx = list.findIndex((t) => t.id === track.id);
      if (idx === -1 || idx >= list.length - 1) {
        setPlaying(false);
        setProgress(0);
        playingRef.current = false;
        emitStop();
      } else {
        const nextTrack = list[idx + 1]!;
        setCurrentTrack(nextTrack);
        setPlaying(true);
        setProgress(0);
        playingRef.current = true;
        trackRef.current = nextTrack;
        loadAudio(nextTrack, 0, true);
        emitPlay(nextTrack);
        emitSync(0);
      }
    });
  }

  // Socket listeners (stable, no deps)
  useEffect(() => {
    const socket = connectSocket();

    socket.on('music:sync-state', (payload: { hostId: string; data: SyncData }) => {
      if (hostRef.current !== payload.hostId || !payload.data) return;

      const data = payload.data;
      if (!data.track) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setCurrentTrack(null);
        setPlaying(false);
        return;
      }

      const deezerTrack = fromSyncTrack(data.track);
      const elapsed = data.playing ? (Date.now() - data.timestamp) / 1000 : 0;
      const targetPos = Math.min(data.position + elapsed, data.track.duration);

      if (trackRef.current?.id === deezerTrack.id && audioRef.current) {
        if (Math.abs(audioRef.current.currentTime - targetPos) > 2) {
          audioRef.current.currentTime = targetPos;
        }
        if (data.playing && !playingRef.current) {
          audioRef.current.play().catch(() => {});
          setPlaying(true);
        } else if (!data.playing && playingRef.current) {
          audioRef.current.pause();
          setPlaying(false);
        }
      } else {
        setCurrentTrack(deezerTrack);
        setPlaying(data.playing);
        loadAudio(deezerTrack, targetPos, data.playing);
      }
    });

    socket.on('music:session-ended', (payload: { hostId: string }) => {
      if (hostRef.current === payload.hostId) {
        setHostId(null);
        hostRef.current = null;
      }
    });

    return () => {
      socket.off('music:sync-state');
      socket.off('music:session-ended');
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (hostRef.current) {
        connectSocket().emit('music:leave');
      }
      connectSocket().emit('music:stop');
    };
  }, []);

  const play = useCallback((track: DeezerTrack) => {
    if (hostRef.current) return;

    setCurrentTrack(track);
    setPlaying(true);
    setProgress(0);
    playingRef.current = true;
    trackRef.current = track;
    loadAudio(track, 0, true);
    emitPlay(track);
    emitSync(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (hostRef.current) return;
    if (!audioRef.current) return;

    if (playingRef.current) {
      audioRef.current.pause();
      playingRef.current = false;
      setPlaying(false);
      emitSync(audioRef.current.currentTime);
    } else {
      audioRef.current.play().catch(() => {});
      playingRef.current = true;
      setPlaying(true);
      emitSync(audioRef.current.currentTime);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (hostRef.current) return;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setProgress(time);
    emitSync(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    volumeRef.current = v;
    localStorage.setItem('musicVolume', String(v));
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (hostRef.current) return;
    const track = trackRef.current;
    const list = tracksRef.current;
    if (!track) return;
    const idx = list.findIndex((t) => t.id === track.id);
    if (idx === -1 || idx >= list.length - 1) return;
    play(list[idx + 1]!);
  }, [play]);

  const prevTrack = useCallback(() => {
    if (hostRef.current) return;
    const track = trackRef.current;
    const list = tracksRef.current;
    if (!track) return;
    const idx = list.findIndex((t) => t.id === track.id);
    if (idx <= 0) return;
    play(list[idx - 1]!);
  }, [play]);

  const joinSession = useCallback((id: string) => {
    setHostId(id);
    hostRef.current = id;
    connectSocket().emit('music:join', id);
  }, []);

  const leaveSession = useCallback(() => {
    setHostId(null);
    hostRef.current = null;
    connectSocket().emit('music:leave');
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTrack(null);
    setPlaying(false);
    setProgress(0);
    trackRef.current = null;
    connectSocket().emit('music:stop');
  }, []);

  const setTracks = useCallback((next: DeezerTrack[]) => setTracksState(next), []);

  const value = useMemo(() => ({
    currentTrack,
    playing,
    progress,
    duration,
    volume,
    tracks,
    setTracks,
    play,
    togglePlay,
    seek,
    setVolume,
    next: nextTrack,
    prev: prevTrack,
    hostId,
    joinSession,
    leaveSession,
    stop,
  }), [
    currentTrack, playing, progress, duration, volume, tracks,
    hostId, setTracks, play, togglePlay, seek, setVolume,
    nextTrack, prevTrack, joinSession, leaveSession, stop,
  ]);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return ctx;
}
