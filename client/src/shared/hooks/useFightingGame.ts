import { useEffect, useRef, useCallback, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { useAppSelector } from '@/app/hooks';
import { GameState, RoomInfo, FightingScreen, KEY_NAMES } from '@/widgets/FightingGame/entities';

interface FightingState {
  screen: FightingScreen;
  room: RoomInfo | null;
  gameState: GameState | null;
  playerIndex: number;
  roundWinner: number | null;
  matchWinner: number | null;
  opponentName: string;
}

const ALLOWED_KEYS: ReadonlySet<string> = new Set(Object.values(KEY_NAMES));

export function useFightingGame() {
  const user = useAppSelector((s) => s.user.currentUser);
  const screenRef = useRef<FightingScreen>('menu');
  const [state, setState] = useState<FightingState>({
    screen: 'menu', room: null, gameState: null,
    playerIndex: 0, roundWinner: null, matchWinner: null, opponentName: '',
  });

  screenRef.current = state.screen;

  useEffect(() => {
    const socket = connectSocket();

    const onCreated = (data: { code: string; playerIndex: number; room: RoomInfo }) => {
      setState((prev) => ({ ...prev, screen: 'lobby', room: data.room, playerIndex: data.playerIndex }));
    };

    const onJoined = (data: { opponent: string; bestOf: number; room: RoomInfo; playerIndex: number }) => {
      setState((prev) => ({ ...prev, screen: 'lobby', room: data.room, playerIndex: data.playerIndex, opponentName: data.opponent }));
    };

    const onOpponentJoined = (data: { opponent: string; room: RoomInfo }) => {
      setState((prev) => ({ ...prev, room: data.room, opponentName: data.opponent }));
    };

    const onReadyUpdate = (data: { player1Ready: boolean; player2Ready: boolean }) => {
      setState((prev) => {
        if (!prev.room) return prev;
        return {
          ...prev,
          room: {
            ...prev.room,
            player1: { ...prev.room.player1, ready: data.player1Ready },
            player2: prev.room.player2 ? { ...prev.room.player2, ready: data.player2Ready } : null,
          },
        };
      });
    };

    const onStart = (data: { state: GameState }) => {
      setState((prev) => ({ ...prev, screen: 'countdown', gameState: data.state, roundWinner: null, matchWinner: null }));
    };

    const onTick = (data: { state: GameState }) => {
      const gs = data.state;
      setState((prev) => {
        let screen: FightingScreen = prev.screen;
        if (gs.status === 'countdown') screen = 'countdown';
        else if (gs.status === 'playing') screen = 'playing';
        else if (gs.status === 'round_end') screen = 'round_end';
        else if (gs.status === 'match_end') screen = 'match_end';
        return { ...prev, screen, gameState: gs, roundWinner: gs.roundWinner, matchWinner: gs.matchWinner };
      });
    };

    const onError = (data: { message: string }) => { alert(data.message); };

    const onOpponentLeft = () => {
      setState({ screen: 'menu', room: null, gameState: null, playerIndex: 0, roundWinner: null, matchWinner: null, opponentName: '' });
      alert('Opponent left the game');
    };

    socket.on('fighting:created', onCreated);
    socket.on('fighting:joined', onJoined);
    socket.on('fighting:opponent_joined', onOpponentJoined);
    socket.on('fighting:ready_update', onReadyUpdate);
    socket.on('fighting:start', onStart);
    socket.on('fighting:tick', onTick);
    socket.on('fighting:error', onError);
    socket.on('fighting:opponent_left', onOpponentLeft);

    return () => {
      socket.off('fighting:created', onCreated);
      socket.off('fighting:joined', onJoined);
      socket.off('fighting:opponent_joined', onOpponentJoined);
      socket.off('fighting:ready_update', onReadyUpdate);
      socket.off('fighting:start', onStart);
      socket.off('fighting:tick', onTick);
      socket.off('fighting:error', onError);
      socket.off('fighting:opponent_left', onOpponentLeft);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (screenRef.current !== 'menu') {
        connectSocket().emit('fighting:leave');
      }
    };
  }, []);

  useEffect(() => {
    if (state.screen !== 'playing' && state.screen !== 'countdown') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!ALLOWED_KEYS.has(e.code)) return;
      e.preventDefault();
      connectSocket().emit('fighting:keydown', { code: e.code });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!ALLOWED_KEYS.has(e.code)) return;
      e.preventDefault();
      connectSocket().emit('fighting:keyup', { code: e.code });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.screen, state.playerIndex]);

  const createRoom = useCallback((bestOf: number) => {
    connectSocket().emit('fighting:create', { bestOf, displayName: user?.displayName || 'Player' });
  }, [user]);

  const joinRoom = useCallback((code: string) => {
    connectSocket().emit('fighting:join', { code, displayName: user?.displayName || 'Player' });
  }, [user]);

  const toggleReady = useCallback(() => {
    connectSocket().emit('fighting:ready');
  }, []);

  const rematch = useCallback(() => {
    connectSocket().emit('fighting:rematch');
  }, []);

  const leave = useCallback(() => {
    connectSocket().emit('fighting:leave');
    setState({ screen: 'menu', room: null, gameState: null, playerIndex: 0, roundWinner: null, matchWinner: null, opponentName: '' });
  }, []);

  return { state, createRoom, joinRoom, toggleReady, rematch, leave };
}
