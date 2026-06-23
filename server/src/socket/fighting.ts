import { Server, Socket } from 'socket.io';

const InputFlag = {
  LEFT: 1,
  RIGHT: 2,
  JUMP: 4,
  BLOCK: 8,
  PUNCH: 16,
  KICK: 32,
} as const;

type FighterStatus =
  | 'idle' | 'walk' | 'jump' | 'punch' | 'kick' | 'block'
  | 'hit' | 'knocked_down' | 'getup';

interface FighterState {
  x: number; y: number; vx: number; vy: number;
  facingRight: boolean;
  hp: number; maxHp: number;
  status: FighterStatus;
  stateTimer: number;
}

interface GameState {
  fighters: [FighterState, FighterState];
  round: number;
  totalRounds: number;
  scores: [number, number];
  timer: number;
  status: 'countdown' | 'playing' | 'round_end' | 'match_end';
  roundWinner: number | null;
  matchWinner: number | null;
  countdown: number;
}

interface GameRoom {
  code: string;
  bestOf: number;
  totalRounds: number;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  state: GameState | null;
  interval: ReturnType<typeof setInterval> | null;
  inputs: [number, number];
  running: boolean;
}

const rooms = new Map<string, GameRoom>();
const codes = new Set<string>();

const GROUND_Y = 370;
const WALL_LEFT = 30;
const WALL_RIGHT = 770;
const FIGHTER_WIDTH = 40;
const MOVE_SPEED = 5;
const JUMP_FORCE = -10;
const GRAVITY = 0.6;
const PUNCH_RANGE = 50;
const KICK_RANGE = 65;
const PUNCH_DAMAGE = 8;
const KICK_DAMAGE = 12;
const PUNCH_DURATION = 8;
const KICK_DURATION = 12;
const HIT_STUN = 12;
const GETUP_DURATION = 20;
const ROUND_TIME = 99;
const COUNTDOWN_DURATION = 90;
const ROUND_END_DELAY = 60;
const TICK_MS = 50;

function randCode(): string {
  let c: string;
  do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (codes.has(c));
  codes.add(c);
  return c;
}

function createFighters(): [FighterState, FighterState] {
  return [
    { x: 200, y: GROUND_Y, vx: 0, vy: 0, facingRight: true, hp: 100, maxHp: 100, status: 'idle', stateTimer: 0 },
    { x: 600, y: GROUND_Y, vx: 0, vy: 0, facingRight: false, hp: 100, maxHp: 100, status: 'idle', stateTimer: 0 },
  ];
}

function freshState(totalRounds: number): GameState {
  return {
    fighters: createFighters(),
    round: 1,
    totalRounds,
    scores: [0, 0],
    timer: ROUND_TIME * 20,
    status: 'countdown',
    roundWinner: null,
    matchWinner: null,
    countdown: COUNTDOWN_DURATION,
  };
}

function tryHit(attackerN: number, def: FighterState, dmg: number): void {
  if (def.status === 'knocked_down' || def.status === 'getup') return;
  if (def.status === 'block') {
    def.hp -= Math.floor(dmg * 0.25);
  } else {
    def.hp -= dmg;
    def.status = 'hit';
    def.stateTimer = HIT_STUN;
    def.vy = -3;
    def.vx = attackerN === 0 ? 6 : -6;
  }
}

function tick(room: GameRoom): void {
  const gs = room.state;
  if (!gs || gs.status === 'match_end') return;

  if (gs.status === 'countdown') {
    gs.countdown--;
    if (gs.countdown <= 0) {
      gs.status = 'playing';
      gs.countdown = 0;
    }
    return;
  }

  if (gs.status === 'round_end') {
    gs.countdown--;
    if (gs.countdown <= 0) {
      gs.fighters = createFighters();
      gs.timer = ROUND_TIME * 20;
      gs.countdown = COUNTDOWN_DURATION;
      gs.status = 'countdown';
      gs.roundWinner = null;
      room.inputs = [0, 0];
    }
    return;
  }

  if (gs.status !== 'playing') return;

  const [f0, f1] = gs.fighters;
  const [i0, i1] = room.inputs;
  const f: [FighterState, FighterState] = [f0, f1];
  const inp: [number, number] = [i0, i1];

  for (let i = 0; i < 2; i++) {
    const me = f[i]!;
    const op = f[1 - i]!;
    const input = inp[i]!;
    if (me.stateTimer > 0) me.stateTimer--;
    me.facingRight = me.x < op.x;

    switch (me.status) {
      case 'idle':
      case 'walk': {
        me.vx = 0;
        let moving = false;
        if (input & InputFlag.LEFT) { me.vx = -MOVE_SPEED; moving = true; }
        if (input & InputFlag.RIGHT) { me.vx = MOVE_SPEED; moving = true; }
        me.status = moving ? 'walk' : 'idle';

        if (input & InputFlag.JUMP && me.y >= GROUND_Y - 1) {
          me.vy = JUMP_FORCE; me.status = 'jump'; break;
        }
        if (input & InputFlag.BLOCK && me.y >= GROUND_Y - 1) {
          me.status = 'block'; break;
        }
        if ((input & InputFlag.PUNCH) && me.stateTimer <= 0) {
          me.status = 'punch'; me.stateTimer = PUNCH_DURATION;
          if (Math.abs(me.x - op.x) <= PUNCH_RANGE) tryHit(i, op, PUNCH_DAMAGE);
          break;
        }
        if ((input & InputFlag.KICK) && me.stateTimer <= 0) {
          me.status = 'kick'; me.stateTimer = KICK_DURATION;
          if (Math.abs(me.x - op.x) <= KICK_RANGE) tryHit(i, op, KICK_DAMAGE);
          break;
        }
        break;
      }
      case 'jump': {
        me.vy += GRAVITY;
        if (input & InputFlag.LEFT) me.vx = -MOVE_SPEED * 0.7;
        else if (input & InputFlag.RIGHT) me.vx = MOVE_SPEED * 0.7;
        else me.vx *= 0.85;
        if ((input & InputFlag.PUNCH) && me.stateTimer <= 0) {
          me.stateTimer = PUNCH_DURATION;
          if (Math.abs(me.x - op.x) <= PUNCH_RANGE) tryHit(i, op, PUNCH_DAMAGE);
        }
        if ((input & InputFlag.KICK) && me.stateTimer <= 0) {
          me.stateTimer = KICK_DURATION;
          if (Math.abs(me.x - op.x) <= KICK_RANGE) tryHit(i, op, KICK_DAMAGE);
        }
        if (me.y >= GROUND_Y) { me.y = GROUND_Y; me.vy = 0; me.status = 'idle'; }
        break;
      }
      case 'punch':
      case 'kick':
        if (me.stateTimer <= 0) me.status = 'idle';
        break;
      case 'block':
        if (!(input & InputFlag.BLOCK)) me.status = 'idle';
        break;
      case 'hit':
        me.vy += GRAVITY; me.vx *= 0.9;
        if (me.stateTimer <= 0) me.status = 'idle';
        if (me.y >= GROUND_Y) { me.y = GROUND_Y; me.vy = 0; }
        break;
      case 'knocked_down':
        me.vy += GRAVITY; me.vx *= 0.9;
        if (me.stateTimer <= 0) { me.status = 'getup'; me.stateTimer = GETUP_DURATION; }
        if (me.y >= GROUND_Y) { me.y = GROUND_Y; me.vy = 0; }
        break;
      case 'getup':
        if (me.stateTimer <= 0) { me.status = 'idle'; me.x = i === 0 ? 200 : 600; me.y = GROUND_Y; }
        break;
    }

    me.x += me.vx;
    me.y += me.vy;
  }

  for (let i = 0; i < 2; i++) {
    if (f[i]!.y > GROUND_Y) { f[i]!.y = GROUND_Y; f[i]!.vy = 0; }
    if (f[i]!.x < WALL_LEFT) f[i]!.x = WALL_LEFT;
    if (f[i]!.x > WALL_RIGHT) f[i]!.x = WALL_RIGHT;
  }

  const dx = f[0]!.x - f[1]!.x;
  if (Math.abs(dx) < FIGHTER_WIDTH) {
    const overlap = FIGHTER_WIDTH - Math.abs(dx);
    const sign = dx >= 0 ? 1 : -1;
    f[0]!.x += sign * overlap / 2;
    f[1]!.x -= sign * overlap / 2;
  }

  gs.timer--;
  if (gs.timer <= 0 || f[0]!.hp <= 0 || f[1]!.hp <= 0) {
    let winner: number | null = null;
    if (f[0].hp <= 0 && f[1].hp > 0) winner = 1;
    else if (f[1].hp <= 0 && f[0].hp > 0) winner = 0;
    else if (f[0].hp > f[1].hp) winner = 0;
    else if (f[1].hp > f[0].hp) winner = 1;

    const scores: [number, number] = [...gs.scores];
    if (winner !== null) scores[winner]!++;

    const needed = Math.ceil(gs.totalRounds / 2);
    const matchWinner = scores[0] >= needed ? 0 : scores[1] >= needed ? 1 : null;

    gs.scores = scores;
    gs.roundWinner = winner;
    gs.round++;
    gs.status = matchWinner !== null ? 'match_end' : 'round_end';
    if (gs.status === 'round_end') gs.countdown = ROUND_END_DELAY;
    gs.matchWinner = matchWinner;
  }
}

function startGameLoop(room: GameRoom, io: Server): void {
  if (room.interval) clearInterval(room.interval);
  room.state = freshState(room.totalRounds);
  room.inputs = [0, 0];
  room.player1Ready = false;
  room.player2Ready = false;
  room.running = true;

  io.to(`fighting:${room.code}`).emit('fighting:start', { state: room.state });

  room.interval = setInterval(() => {
    if (!room.running) return;
    tick(room);
    if (room.state) {
      io.to(`fighting:${room.code}`).emit('fighting:tick', { state: room.state });
    }
    if (room.state?.status === 'match_end') {
      room.running = false;
      if (room.interval) clearInterval(room.interval);
      room.interval = null;
    }
  }, TICK_MS);
}

function cleanup(code: string, io: Server): void {
  const room = rooms.get(code);
  if (!room) return;
  if (room.interval) clearInterval(room.interval);
  io.to(`fighting:${code}`).emit('fighting:opponent_left');
  rooms.delete(code);
  codes.delete(code);
}

export function handleFighting(socket: Socket, io: Server, userId: string): void {
  socket.on('fighting:create', (data: { bestOf?: number; displayName?: string }) => {
    const code = randCode();
    const bestOf = data?.bestOf ?? 3;
    const room: GameRoom = {
      code,
      bestOf,
      totalRounds: bestOf,
      player1Id: userId,
      player1Name: data?.displayName || 'Player 1',
      player2Id: null,
      player2Name: null,
      player1Ready: false,
      player2Ready: false,
      state: null,
      interval: null,
      inputs: [0, 0],
      running: false,
    };
    rooms.set(code, room);
    socket.join(`fighting:${code}`);
    socket.emit('fighting:created', {
      code,
      playerIndex: 0,
      room: {
        code,
        bestOf: room.bestOf,
        player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
        player2: null,
      },
    });
  });

  socket.on('fighting:join', (data: { code: string; displayName?: string }) => {
    const room = rooms.get(data?.code);
    if (!room) { socket.emit('fighting:error', { message: 'Room not found' }); return; }
    if (room.player2Id) { socket.emit('fighting:error', { message: 'Room is full' }); return; }
    if (room.player1Id === userId) { socket.emit('fighting:error', { message: 'You are already in this room' }); return; }

    room.player2Id = userId;
    room.player2Name = data?.displayName || 'Player 2';
    socket.join(`fighting:${room.code}`);

    const info = {
      code: room.code,
      bestOf: room.bestOf,
      player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
      player2: { id: room.player2Id, name: room.player2Name, ready: room.player2Ready },
    };

    socket.emit('fighting:joined', {
      opponent: room.player1Name,
      bestOf: room.bestOf,
      room: info,
      playerIndex: 1,
    });

    socket.to(`fighting:${room.code}`).emit('fighting:opponent_joined', {
      opponent: room.player2Name,
      room: info,
    });
  });

  socket.on('fighting:ready', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        room.player1Ready = !room.player1Ready;
        io.to(`fighting:${room.code}`).emit('fighting:ready_update', {
          player1Ready: room.player1Ready,
          player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player2Id) {
          startGameLoop(room, io);
        }
        return;
      }
      if (room.player2Id === userId) {
        room.player2Ready = !room.player2Ready;
        io.to(`fighting:${room.code}`).emit('fighting:ready_update', {
          player1Ready: room.player1Ready,
          player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player1Id) {
          startGameLoop(room, io);
        }
        return;
      }
    }
  });

  socket.on('fighting:input', (data: { input: number }) => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        room.inputs[0] = data?.input ?? 0;
        return;
      }
      if (room.player2Id === userId) {
        room.inputs[1] = data?.input ?? 0;
        return;
      }
    }
  });

  socket.on('fighting:rematch', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId || room.player2Id === userId) {
        if (room.running) return;
        startGameLoop(room, io);
        return;
      }
    }
  });

  socket.on('fighting:leave', () => {
    for (const code of rooms.keys()) {
      const room = rooms.get(code);
      if (room?.player1Id === userId || room?.player2Id === userId) {
        cleanup(code, io);
        return;
      }
    }
  });
}

export function cleanupFightingSessions(userId: string, io: Server): void {
  for (const [code, room] of rooms.entries()) {
    if (room.player1Id === userId || room.player2Id === userId) {
      cleanup(code, io);
    }
  }
}
