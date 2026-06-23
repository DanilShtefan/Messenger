import { useEffect, useRef, useCallback, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { useAppSelector } from '@/app/hooks';

interface Move {
  from: [number, number];
  to: [number, number];
}

interface GameState {
  board: number[][];
  currentPlayer: number;
  winner: number | null;
  moveCount: number;
  lastMove: Move | null;
  captured: [number, number][];
  mustContinue: [number, number] | null;
}

interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

interface RoomInfo {
  code: string;
  player1: PlayerInfo;
  player2: PlayerInfo | null;
}

type Screen = 'menu' | 'lobby' | 'playing';

interface CheckersState {
  screen: Screen;
  room: RoomInfo | null;
  gameState: GameState | null;
  playerIndex: number;
  opponentName: string;
}

export function useCheckersGame() {
  const user = useAppSelector((s) => s.user.currentUser);
  const screenRef = useRef<Screen>('menu');
  const [state, setState] = useState<CheckersState>({
    screen: 'menu', room: null, gameState: null,
    playerIndex: 0, opponentName: '',
  });

  screenRef.current = state.screen;

  useEffect(() => {
    const socket = connectSocket();

    const onCreated = (data: { code: string; playerIndex: number; room: RoomInfo }) => {
      setState((prev) => ({ ...prev, screen: 'lobby', room: data.room, playerIndex: data.playerIndex }));
    };

    const onJoined = (data: { opponent: string; room: RoomInfo; playerIndex: number }) => {
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
      setState((prev) => ({ ...prev, screen: 'playing', gameState: data.state }));
    };

    const onState = (data: { state: GameState }) => {
      setState((prev) => ({ ...prev, gameState: data.state }));
    };

    const onRematchReset = () => {
      setState((prev) => ({ ...prev, screen: 'lobby', gameState: null }));
    };

    const onError = (data: { message: string }) => { alert(data.message); };

    const onOpponentLeft = () => {
      setState({ screen: 'menu', room: null, gameState: null, playerIndex: 0, opponentName: '' });
      alert('Opponent left the game');
    };

    socket.on('checkers:created', onCreated);
    socket.on('checkers:joined', onJoined);
    socket.on('checkers:opponent_joined', onOpponentJoined);
    socket.on('checkers:ready_update', onReadyUpdate);
    socket.on('checkers:start', onStart);
    socket.on('checkers:state', onState);
    socket.on('checkers:rematch_reset', onRematchReset);
    socket.on('checkers:error', onError);
    socket.on('checkers:opponent_left', onOpponentLeft);

    return () => {
      socket.off('checkers:created', onCreated);
      socket.off('checkers:joined', onJoined);
      socket.off('checkers:opponent_joined', onOpponentJoined);
      socket.off('checkers:ready_update', onReadyUpdate);
      socket.off('checkers:start', onStart);
      socket.off('checkers:state', onState);
      socket.off('checkers:rematch_reset', onRematchReset);
      socket.off('checkers:error', onError);
      socket.off('checkers:opponent_left', onOpponentLeft);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (screenRef.current !== 'menu') {
        connectSocket().emit('checkers:leave');
      }
    };
  }, []);

  const createRoom = useCallback((chosenColor?: number) => {
    connectSocket().emit('checkers:create', { displayName: user?.displayName || 'Player', chosenColor: chosenColor ?? 0 });
  }, [user]);

  const joinRoom = useCallback((code: string) => {
    connectSocket().emit('checkers:join', { code, displayName: user?.displayName || 'Player' });
  }, [user]);

  const toggleReady = useCallback(() => {
    connectSocket().emit('checkers:ready');
  }, []);

  const makeMove = useCallback((from: [number, number], to: [number, number]) => {
    connectSocket().emit('checkers:move', { from, to });
  }, []);

  const rematch = useCallback(() => {
    connectSocket().emit('checkers:rematch');
  }, []);

  const leave = useCallback(() => {
    connectSocket().emit('checkers:leave');
    setState({ screen: 'menu', room: null, gameState: null, playerIndex: 0, opponentName: '' });
  }, []);

  return { state, createRoom, joinRoom, toggleReady, makeMove, rematch, leave };
}
