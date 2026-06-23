import { Server, Socket } from 'socket.io';

type Cell = 'X' | 'O' | null;
type Board = [[Cell, Cell, Cell], [Cell, Cell, Cell], [Cell, Cell, Cell]];

interface GameState {
  board: Board;
  currentPlayer: 0 | 1;
  winner: number | null;
  draw: boolean;
  moveCount: number;
  lastMove: { row: number; col: number } | null;
}

interface GameRoom {
  code: string;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  state: GameState | null;
  running: boolean;
}

const rooms = new Map<string, GameRoom>();
const codes = new Set<string>();

const WINNING_LINES: readonly (readonly [number, number])[][] = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

function randCode(): string {
  let c: string;
  do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (codes.has(c));
  codes.add(c);
  return c;
}

function freshBoard(): Board {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

function freshState(): GameState {
  return {
    board: freshBoard(),
    currentPlayer: 0,
    winner: null,
    draw: false,
    moveCount: 0,
    lastMove: null,
  };
}

function checkWin(board: Board): number | null {
  for (const line of WINNING_LINES) {
    const a0 = line[0]![0];
    const a1 = line[0]![1];
    const b0 = line[1]![0];
    const b1 = line[1]![1];
    const c0 = line[2]![0];
    const c1 = line[2]![1];
    const va = board[a0]![a1]!;
    const vb = board[b0]![b1]!;
    const vc = board[c0]![c1]!;
    if (va && va === vb && vb === vc) {
      return va === 'X' ? 0 : 1;
    }
  }
  return null;
}

function isDraw(board: Board): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r]![c] === null) return false;
    }
  }
  return true;
}

function cleanup(code: string, io: Server): void {
  const room = rooms.get(code);
  if (!room) return;
  io.to(`tictactoe:${code}`).emit('tictactoe:opponent_left');
  rooms.delete(code);
  codes.delete(code);
}

export function handleTicTacToe(socket: Socket, io: Server, userId: string): void {
  socket.on('tictactoe:create', (data: { displayName?: string }) => {
    const code = randCode();
    const room: GameRoom = {
      code,
      player1Id: userId,
      player1Name: data?.displayName || 'Player 1',
      player2Id: null,
      player2Name: null,
      player1Ready: false,
      player2Ready: false,
      state: null,
      running: false,
    };
    rooms.set(code, room);
    socket.join(`tictactoe:${code}`);
    socket.emit('tictactoe:created', {
      code, playerIndex: 0,
      room: {
        code,
        player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
        player2: null,
      },
    });
  });

  socket.on('tictactoe:join', (data: { code: string; displayName?: string }) => {
    const room = rooms.get(data?.code);
    if (!room) { socket.emit('tictactoe:error', { message: 'Room not found' }); return; }
    if (room.player2Id) { socket.emit('tictactoe:error', { message: 'Room is full' }); return; }
    if (room.player1Id === userId) { socket.emit('tictactoe:error', { message: 'You are already in this room' }); return; }

    room.player2Id = userId;
    room.player2Name = data?.displayName || 'Player 2';
    socket.join(`tictactoe:${room.code}`);

    const info = {
      code: room.code,
      player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
      player2: { id: room.player2Id, name: room.player2Name, ready: room.player2Ready },
    };

    socket.emit('tictactoe:joined', {
      opponent: room.player1Name, room: info, playerIndex: 1,
    });
    socket.to(`tictactoe:${room.code}`).emit('tictactoe:opponent_joined', {
      opponent: room.player2Name, room: info,
    });
  });

  socket.on('tictactoe:ready', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        room.player1Ready = !room.player1Ready;
        io.to(`tictactoe:${room.code}`).emit('tictactoe:ready_update', {
          player1Ready: room.player1Ready, player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player2Id) {
          room.running = true;
          room.state = freshState();
          io.to(`tictactoe:${room.code}`).emit('tictactoe:start', { state: room.state });
        }
        return;
      }
      if (room.player2Id === userId) {
        room.player2Ready = !room.player2Ready;
        io.to(`tictactoe:${room.code}`).emit('tictactoe:ready_update', {
          player1Ready: room.player1Ready, player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player1Id) {
          room.running = true;
          room.state = freshState();
          io.to(`tictactoe:${room.code}`).emit('tictactoe:start', { state: room.state });
        }
        return;
      }
    }
  });

  socket.on('tictactoe:move', (data: { row: number; col: number }) => {
    for (const room of rooms.values()) {
      const playerIdx = room.player1Id === userId ? 0 : room.player2Id === userId ? 1 : -1;
      if (playerIdx === -1 || !room.state || !room.running) continue;

      const gs = room.state;
      if (gs.winner !== null || gs.draw) return;
      if (gs.currentPlayer !== playerIdx) return;

      const { row, col } = data;
      if (row < 0 || row > 2 || col < 0 || col > 2) return;
      if (gs.board[row]![col] !== null) return;

      const mark = playerIdx === 0 ? 'X' : 'O';
      gs.board[row]![col] = mark;
      gs.moveCount++;
      gs.lastMove = { row, col };

      const winner = checkWin(gs.board);
      if (winner !== null) {
        gs.winner = winner;
        room.running = false;
      } else if (isDraw(gs.board)) {
        gs.draw = true;
        room.running = false;
      } else {
        gs.currentPlayer = (gs.currentPlayer === 0 ? 1 : 0) as 0 | 1;
      }

      io.to(`tictactoe:${room.code}`).emit('tictactoe:state', { state: gs });
      break;
    }
  });

  socket.on('tictactoe:rematch', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId || room.player2Id === userId) {
        room.player1Ready = false;
        room.player2Ready = false;
        room.state = null;
        room.running = false;
        io.to(`tictactoe:${room.code}`).emit('tictactoe:rematch_reset');
        return;
      }
    }
  });

  socket.on('tictactoe:leave', () => {
    for (const code of rooms.keys()) {
      const room = rooms.get(code);
      if (room?.player1Id === userId || room?.player2Id === userId) {
        cleanup(code, io);
        return;
      }
    }
  });
}

export function cleanupTicTacToeSessions(userId: string, io: Server): void {
  for (const [code, room] of rooms.entries()) {
    if (room.player1Id === userId || room.player2Id === userId) {
      cleanup(code, io);
    }
  }
}
