import { useEffect, useRef, useCallback, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { useAppSelector } from '@/app/hooks';

interface GameState {
  board: (null | 'X' | 'O')[][];
  currentPlayer: 0 | 1;
  winner: number | null;
  draw: boolean;
  moveCount: number;
  lastMove: { row: number; col: number } | null;
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

interface TicTacToeState {
  screen: Screen;
  room: RoomInfo | null;
  gameState: GameState | null;
  playerIndex: number;
  opponentName: string;
}

export function useTicTacToeGame() {
  const user = useAppSelector((s) => s.user.currentUser);
  const screenRef = useRef<Screen>('menu');
  const [state, setState] = useState<TicTacToeState>({
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

    socket.on('tictactoe:created', onCreated);
    socket.on('tictactoe:joined', onJoined);
    socket.on('tictactoe:opponent_joined', onOpponentJoined);
    socket.on('tictactoe:ready_update', onReadyUpdate);
    socket.on('tictactoe:start', onStart);
    socket.on('tictactoe:state', onState);
    socket.on('tictactoe:rematch_reset', onRematchReset);
    socket.on('tictactoe:error', onError);
    socket.on('tictactoe:opponent_left', onOpponentLeft);

    return () => {
      socket.off('tictactoe:created', onCreated);
      socket.off('tictactoe:joined', onJoined);
      socket.off('tictactoe:opponent_joined', onOpponentJoined);
      socket.off('tictactoe:ready_update', onReadyUpdate);
      socket.off('tictactoe:start', onStart);
      socket.off('tictactoe:state', onState);
      socket.off('tictactoe:rematch_reset', onRematchReset);
      socket.off('tictactoe:error', onError);
      socket.off('tictactoe:opponent_left', onOpponentLeft);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (screenRef.current !== 'menu') {
        connectSocket().emit('tictactoe:leave');
      }
    };
  }, []);

  const createRoom = useCallback(() => {
    connectSocket().emit('tictactoe:create', { displayName: user?.displayName || 'Player' });
  }, [user]);

  const joinRoom = useCallback((code: string) => {
    connectSocket().emit('tictactoe:join', { code, displayName: user?.displayName || 'Player' });
  }, [user]);

  const toggleReady = useCallback(() => {
    connectSocket().emit('tictactoe:ready');
  }, []);

  const makeMove = useCallback((row: number, col: number) => {
    connectSocket().emit('tictactoe:move', { row, col });
  }, []);

  const rematch = useCallback(() => {
    connectSocket().emit('tictactoe:rematch');
  }, []);

  const leave = useCallback(() => {
    connectSocket().emit('tictactoe:leave');
    setState({ screen: 'menu', room: null, gameState: null, playerIndex: 0, opponentName: '' });
  }, []);

  return { state, createRoom, joinRoom, toggleReady, makeMove, rematch, leave };
}
