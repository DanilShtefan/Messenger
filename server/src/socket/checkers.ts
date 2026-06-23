import { Server, Socket } from 'socket.io';

const EMPTY = 0;
const WHITE = 1;
const BLACK = 2;
const WHITE_KING = 3;
const BLACK_KING = 4;

type Board = number[][];

interface Move {
  from: [number, number];
  to: [number, number];
}

interface GameState {
  board: Board;
  currentPlayer: number;
  winner: number | null;
  moveCount: number;
  lastMove: Move | null;
  captured: [number, number][];
  mustContinue: [number, number] | null;
}

interface GameRoom {
  code: string;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  player1Color: number;
  player2Color: number;
  player1Ready: boolean;
  player2Ready: boolean;
  state: GameState | null;
  running: boolean;
}

const rooms = new Map<string, GameRoom>();
const codes = new Set<string>();

function randCode(): string {
  let c: string;
  do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (codes.has(c));
  codes.add(c);
  return c;
}

function initBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 0) {
        if (r < 3) b[r]![c] = BLACK;
        else if (r > 4) b[r]![c] = WHITE;
      }
    }
  }
  return b;
}

function isWhite(piece: number): boolean {
  return piece === WHITE || piece === WHITE_KING;
}

function isKing(piece: number): boolean {
  return piece === WHITE_KING || piece === BLACK_KING;
}

function owner(piece: number): number {
  return isWhite(piece) ? 0 : 1;
}

function opponent(p: number): number {
  return p === 0 ? 1 : 0;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getSimpleMoves(board: Board, r: number, c: number): [number, number][] {
  const p = board[r]![c]!;
  if (!p) return [];
  const isWhitePiece = isWhite(p);
  const isKingPiece = isKing(p);
  const dirs: [number, number][] = [];

  if (isWhitePiece || isKingPiece) {
    dirs.push([-1, -1], [-1, 1]);
  }
  if (!isWhitePiece || isKingPiece) {
    dirs.push([1, -1], [1, 1]);
  }

  const moves: [number, number][] = [];
  for (const [dr, dc] of dirs) {
    const limit = isKingPiece ? 7 : 1;
    for (let i = 1; i <= limit; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (!inBounds(nr, nc)) break;
      if (board[nr]![nc] !== EMPTY) break;
      if ((nr + nc) % 2 !== 0) {
        moves.push([nr, nc]);
      }
    }
  }
  return moves;
}

function getJumps(board: Board, r: number, c: number): { to: [number, number]; captured: [number, number] }[] {
  const p = board[r]![c]!;
  if (!p) return [];
  const isWhitePiece = isWhite(p);
  const isKingPiece = isKing(p);
  const dirs: [number, number][] = [];

  if (isWhitePiece || isKingPiece) {
    dirs.push([-1, -1], [-1, 1]);
  }
  if (!isWhitePiece || isKingPiece) {
    dirs.push([1, -1], [1, 1]);
  }

  const jumps: { to: [number, number]; captured: [number, number] }[] = [];
  outer:
  for (const [dr, dc] of dirs) {
    let captured: [number, number] | null = null;
    const limit = isKingPiece ? 7 : 2;
    for (let i = 1; i <= limit; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (!inBounds(nr, nc)) continue outer;
      const cell = board[nr]![nc]!;
      if (captured) {
        if (cell !== EMPTY) continue outer;
        if ((nr + nc) % 2 === 0) continue;
        jumps.push({ to: [nr, nc], captured });
        if (!isKingPiece) continue outer;
      } else {
        if (cell === EMPTY) {
          if (!isKingPiece) continue outer;
          continue;
        }
        if (owner(cell) === owner(p)) continue outer;
        captured = [nr, nc];
      }
    }
  }
  return jumps;
}

function hasAnyJumps(board: Board, player: number): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r]![c]!;
      if (p === EMPTY) continue;
      if (owner(p) !== player) continue;
      const jumps = getJumps(board, r, c);
      if (jumps.length > 0) return true;
    }
  }
  return false;
}

function freshState(): GameState {
  return {
    board: initBoard(),
    currentPlayer: 0,
    winner: null,
    moveCount: 0,
    lastMove: null,
    captured: [],
    mustContinue: null,
  };
}

function cloneBoard(board: Board): Board {
  return board.map((r) => [...r]);
}

function applyMove(board: Board, from: [number, number], to: [number, number], captured: [number, number] | null): void {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const p = board[fr]![fc]!;
  board[fr]![fc] = EMPTY;

  let newPiece = p;
  // Promotion
  if (p === WHITE && tr === 0) newPiece = WHITE_KING;
  else if (p === BLACK && tr === 7) newPiece = BLACK_KING;

  board[tr]![tc] = newPiece;

  if (captured) {
    const [cr, cc] = captured;
    board[cr]![cc] = EMPTY;
  }
}

function getAllMoves(board: Board, player: number): { from: [number, number]; to: [number, number] }[] {
  const moves: { from: [number, number]; to: [number, number] }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r]![c]!;
      if (p === EMPTY || owner(p) !== player) continue;
      for (const to of getSimpleMoves(board, r, c)) {
        moves.push({ from: [r, c], to });
      }
    }
  }
  return moves;
}

function handleMove(gs: GameState, from: [number, number], to: [number, number]): GameState | null {
  const board = gs.board;
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = board[fr]![fc]!;

  if (!piece || owner(piece) !== gs.currentPlayer) return null;
  if (board[tr]![tc] !== EMPTY) return null;

  // Chain continuation
  if (gs.mustContinue) {
    const [mr, mc] = gs.mustContinue;
    if (mr !== fr || mc !== fc) return null;
    const jumps = getJumps(board, fr, fc);
    const jump = jumps.find((j) => j.to[0] === tr && j.to[1] === tc);
    if (!jump) return null;

    const newBoard = cloneBoard(board);
    applyMove(newBoard, from, to, jump.captured);

    const result: GameState = {
      board: newBoard,
      currentPlayer: gs.currentPlayer,
      winner: null,
      moveCount: gs.moveCount,
      lastMove: { from, to },
      captured: [...gs.captured, jump.captured],
      mustContinue: null,
    };

    // Check for more jumps
    const nextJumps = getJumps(newBoard, tr, tc);
    if (nextJumps.length > 0) {
      result.mustContinue = [tr, tc];
    } else {
      // Check if opponent has any pieces
      result.currentPlayer = opponent(gs.currentPlayer);
    }

    return result;
  }

  // Normal move
  const jumps = getJumps(board, fr, fc);
  const isJump = jumps.some((j) => j.to[0] === tr && j.to[1] === tc);

  if (!isJump) {
    // Simple move
    const simpleMoves = getSimpleMoves(board, fr, fc);
    if (!simpleMoves.some((m) => m[0] === tr && m[1] === tc)) return null;

    // If any jump exists for current player, simple moves are not allowed
    if (hasAnyJumps(board, gs.currentPlayer)) return null;

    const newBoard = cloneBoard(board);
    applyMove(newBoard, from, to, null);

    const result: GameState = {
      board: newBoard,
      currentPlayer: opponent(gs.currentPlayer),
      winner: null,
      moveCount: gs.moveCount + 1,
      lastMove: { from, to },
      captured: [],
      mustContinue: null,
    };

    return result;
  }

  // Jump move
  const jump = jumps.find((j) => j.to[0] === tr && j.to[1] === tc)!;
  const newBoard = cloneBoard(board);
  applyMove(newBoard, from, to, jump.captured);

  const result: GameState = {
    board: newBoard,
    currentPlayer: gs.currentPlayer,
    winner: null,
    moveCount: gs.moveCount,
    lastMove: { from, to },
    captured: [jump.captured],
    mustContinue: null,
  };

  // Check for chain
  const nextJumps = getJumps(newBoard, tr, tc);
  if (nextJumps.length > 0) {
    result.mustContinue = [tr, tc];
  } else {
    result.currentPlayer = opponent(gs.currentPlayer);
    result.moveCount = gs.moveCount + 1;
  }

  return result;
}

function checkWinner(gs: GameState): void {
  if (gs.winner !== null) return;

  if (gs.moveCount > 0) {
    const moves = getAllMoves(gs.board, gs.currentPlayer);
    if (moves.length === 0) {
      gs.winner = opponent(gs.currentPlayer);
      return;
    }
  }

  // Check if any pieces left
  let hasWhite = false;
  let hasBlack = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = gs.board[r]![c]!;
      if (p === WHITE || p === WHITE_KING) hasWhite = true;
      if (p === BLACK || p === BLACK_KING) hasBlack = true;
    }
  }
  if (!hasWhite) gs.winner = 1;
  else if (!hasBlack) gs.winner = 0;
}

function cleanup(code: string, io: Server): void {
  const room = rooms.get(code);
  if (!room) return;
  io.to(`checkers:${code}`).emit('checkers:opponent_left');
  rooms.delete(code);
  codes.delete(code);
}

export function handleCheckers(socket: Socket, io: Server, userId: string): void {
  socket.on('checkers:create', (data: { displayName?: string; chosenColor?: number }) => {
    const code = randCode();
    const chosenColor = data?.chosenColor ?? 0;
    const room: GameRoom = {
      code,
      player1Id: userId,
      player1Name: data?.displayName || 'Player 1',
      player2Id: null, player2Name: null,
      player1Color: chosenColor,
      player2Color: 1 - chosenColor,
      player1Ready: false, player2Ready: false,
      state: null, running: false,
    };
    rooms.set(code, room);
    socket.join(`checkers:${code}`);
    socket.emit('checkers:created', {
      code, playerIndex: chosenColor,
      room: {
        code,
        player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
        player2: null,
      },
    });
  });

  socket.on('checkers:join', (data: { code: string; displayName?: string }) => {
    const room = rooms.get(data?.code);
    if (!room) { socket.emit('checkers:error', { message: 'Room not found' }); return; }
    if (room.player2Id) { socket.emit('checkers:error', { message: 'Room is full' }); return; }
    if (room.player1Id === userId) { socket.emit('checkers:error', { message: 'You are already in this room' }); return; }
    room.player2Id = userId;
    room.player2Name = data?.displayName || 'Player 2';
    room.player2Color = 1 - room.player1Color;
    socket.join(`checkers:${room.code}`);
    const info = {
      code: room.code,
      player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
      player2: { id: room.player2Id, name: room.player2Name, ready: room.player2Ready },
    };
    socket.emit('checkers:joined', { opponent: room.player1Name, room: info, playerIndex: room.player2Color });
    socket.to(`checkers:${room.code}`).emit('checkers:opponent_joined', { opponent: room.player2Name, room: info });
  });

  socket.on('checkers:ready', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        room.player1Ready = !room.player1Ready;
        io.to(`checkers:${room.code}`).emit('checkers:ready_update', {
          player1Ready: room.player1Ready, player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player2Id) {
          room.running = true;
          room.state = freshState();
          io.to(`checkers:${room.code}`).emit('checkers:start', { state: room.state });
        }
        return;
      }
      if (room.player2Id === userId) {
        room.player2Ready = !room.player2Ready;
        io.to(`checkers:${room.code}`).emit('checkers:ready_update', {
          player1Ready: room.player1Ready, player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player1Id) {
          room.running = true;
          room.state = freshState();
          io.to(`checkers:${room.code}`).emit('checkers:start', { state: room.state });
        }
        return;
      }
    }
  });

  socket.on('checkers:move', (data: { from: [number, number]; to: [number, number] }) => {
    for (const room of rooms.values()) {
      const playerIdx = room.player1Id === userId ? 0 : room.player2Id === userId ? 1 : -1;
      if (playerIdx === -1 || !room.state || !room.running) continue;
      const playerColor = playerIdx === 0 ? room.player1Color : room.player2Color;
      if (room.state.currentPlayer !== playerColor) return;
      if (room.state.winner !== null) return;

      const result = handleMove(room.state, data.from, data.to);
      if (!result) return;

      room.state = result;
      checkWinner(room.state);

      if (room.state.winner !== null) {
        room.running = false;
      }

      io.to(`checkers:${room.code}`).emit('checkers:state', { state: room.state });
      break;
    }
  });

  socket.on('checkers:rematch', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId || room.player2Id === userId) {
        room.player1Ready = false;
        room.player2Ready = false;
        room.state = null;
        room.running = false;
        io.to(`checkers:${room.code}`).emit('checkers:rematch_reset');
        return;
      }
    }
  });

  socket.on('checkers:leave', () => {
    for (const code of rooms.keys()) {
      const room = rooms.get(code);
      if (room?.player1Id === userId || room?.player2Id === userId) {
        cleanup(code, io);
        return;
      }
    }
  });
}

export function cleanupCheckersSessions(userId: string, io: Server): void {
  for (const [code, room] of rooms.entries()) {
    if (room.player1Id === userId || room.player2Id === userId) {
      cleanup(code, io);
    }
  }
}
