import { useEffect, useRef, useCallback, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { useAppSelector } from '@/app/hooks';
import { InputFlag, GameState, RoomInfo, FightingScreen } from '@/widgets/FightingGame/entities';

interface FightingState {
  screen: FightingScreen;
  room: RoomInfo | null;
  gameState: GameState | null;
  playerIndex: number;
  roundWinner: number | null;
  matchWinner: number | null;
  opponentName: string;
}

export function useFightingGame() {
  const user = useAppSelector((s) => s.user.currentUser);
  const inputRef = useRef(0);
  const inputSentRef = useRef(0);
  const screenRef = useRef<FightingScreen>('menu');
  const [state, setState] = useState<FightingState>({
    screen: 'menu',
    room: null,
    gameState: null,
    playerIndex: 0,
    roundWinner: null,
    matchWinner: null,
    opponentName: '',
  });

  screenRef.current = state.screen;

  useEffect(() => {
    const socket = connectSocket();

    const onCreated = (data: { code: string; playerIndex: number; room: RoomInfo }) => {
      setState((prev) => ({
        ...prev,
        screen: 'lobby',
        room: data.room,
        playerIndex: data.playerIndex,
      }));
    };

    const onJoined = (data: { opponent: string; bestOf: number; room: RoomInfo; playerIndex: number }) => {
      setState((prev) => ({
        ...prev,
        screen: 'lobby',
        room: data.room,
        playerIndex: data.playerIndex,
        opponentName: data.opponent,
      }));
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
      setState((prev) => ({
        ...prev,
        screen: 'countdown',
        gameState: data.state,
        roundWinner: null,
        matchWinner: null,
      }));
    };

    const onTick = (data: { state: GameState }) => {
      const gs = data.state;
      setState((prev) => {
        let screen = prev.screen;
        if (gs.status === 'countdown') screen = 'countdown';
        else if (gs.status === 'playing') screen = 'playing';
        else if (gs.status === 'round_end') screen = 'round_end';
        else if (gs.status === 'match_end') screen = 'match_end';
        return {
          ...prev,
          screen,
          gameState: gs,
          roundWinner: gs.roundWinner,
          matchWinner: gs.matchWinner,
        };
      });
    };

    const onError = (data: { message: string }) => {
      alert(data.message);
    };

    const onOpponentLeft = () => {
      setState({
        screen: 'menu',
        room: null,
        gameState: null,
        playerIndex: 0,
        roundWinner: null,
        matchWinner: null,
        opponentName: '',
      });
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

  const sendInput = useCallback(() => {
    const input = inputRef.current;
    if (input !== inputSentRef.current) {
      connectSocket().emit('fighting:input', { input });
      inputSentRef.current = input;
    }
  }, []);

  useEffect(() => {
    if (state.screen !== 'playing' && state.screen !== 'countdown') return;
    const interval = setInterval(sendInput, 50);
    return () => clearInterval(interval);
  }, [state.screen, sendInput]);

  useEffect(() => {
    if (state.screen !== 'playing' && state.screen !== 'countdown') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let bit = 0;
      if (e.repeat) return;
      if (state.playerIndex === 0) {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') bit = InputFlag.LEFT;
        else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') bit = InputFlag.RIGHT;
        else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') bit = InputFlag.JUMP;
        else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') bit = InputFlag.BLOCK;
        else if (e.key === 'f' || e.key === 'F') bit = InputFlag.PUNCH;
        else if (e.key === 'g' || e.key === 'G') bit = InputFlag.KICK;
      } else {
        if (e.key === 'ArrowLeft') bit = InputFlag.LEFT;
        else if (e.key === 'ArrowRight') bit = InputFlag.RIGHT;
        else if (e.key === 'ArrowUp') bit = InputFlag.JUMP;
        else if (e.key === 'ArrowDown') bit = InputFlag.BLOCK;
        else if (e.key === 'j' || e.key === 'J') bit = InputFlag.PUNCH;
        else if (e.key === 'k' || e.key === 'K') bit = InputFlag.KICK;
      }
      if (bit) {
        e.preventDefault();
        inputRef.current |= bit;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let bit = 0;
      if (state.playerIndex === 0) {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') bit = InputFlag.LEFT;
        else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') bit = InputFlag.RIGHT;
        else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') bit = InputFlag.JUMP;
        else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') bit = InputFlag.BLOCK;
        else if (e.key === 'f' || e.key === 'F') bit = InputFlag.PUNCH;
        else if (e.key === 'g' || e.key === 'G') bit = InputFlag.KICK;
      } else {
        if (e.key === 'ArrowLeft') bit = InputFlag.LEFT;
        else if (e.key === 'ArrowRight') bit = InputFlag.RIGHT;
        else if (e.key === 'ArrowUp') bit = InputFlag.JUMP;
        else if (e.key === 'ArrowDown') bit = InputFlag.BLOCK;
        else if (e.key === 'j' || e.key === 'J') bit = InputFlag.PUNCH;
        else if (e.key === 'k' || e.key === 'K') bit = InputFlag.KICK;
      }
      if (bit) {
        e.preventDefault();
        inputRef.current &= ~bit;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      inputRef.current = 0;
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
    setState({
      screen: 'menu',
      room: null,
      gameState: null,
      playerIndex: 0,
      roundWinner: null,
      matchWinner: null,
      opponentName: '',
    });
  }, []);

  return { state, createRoom, joinRoom, toggleReady, rematch, leave };
}
