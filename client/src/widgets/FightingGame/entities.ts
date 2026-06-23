export const MOVE_TYPES = {
  STAND: 'stand',
  WALK: 'walk',
  WALK_BACKWARD: 'walk-backward',
  SQUAT: 'squat',
  STAND_UP: 'stand-up',
  BLOCK: 'block',
  JUMP: 'jump',
  FORWARD_JUMP: 'forward-jump',
  BACKWARD_JUMP: 'backward-jump',
  ENDURE: 'endure',
  SQUAT_ENDURE: 'squat-endure',
  KNOCK_DOWN: 'knock-down',
  ATTRACTIVE_STAND_UP: 'attractive-stand-up',
  FALL: 'fall',
  WIN: 'win',
  HIGH_KICK: 'high-kick',
  LOW_KICK: 'low-kick',
  LOW_PUNCH: 'low-punch',
  HIGH_PUNCH: 'high-punch',
  UPPERCUT: 'uppercut',
  SQUAT_LOW_KICK: 'squat-low-kick',
  SQUAT_HIGH_KICK: 'squat-high-kick',
  SQUAT_LOW_PUNCH: 'squat-low-punch',
  SPIN_KICK: 'spin-kick',
  FORWARD_JUMP_KICK: 'forward-jump-kick',
  BACKWARD_JUMP_KICK: 'backward-jump-kick',
  BACKWARD_JUMP_PUNCH: 'backward-jump-punch',
  FORWARD_JUMP_PUNCH: 'forward-jump-punch',
} as const;

export type MoveType = (typeof MOVE_TYPES)[keyof typeof MOVE_TYPES];

export const IMAGE_COUNT_BY_MOVE_TYPE: Record<string, number> = {
  [MOVE_TYPES.STAND]: 9,
  [MOVE_TYPES.WALK]: 9,
  [MOVE_TYPES.WALK_BACKWARD]: 9,
  [MOVE_TYPES.SQUAT]: 3,
  [MOVE_TYPES.STAND_UP]: 3,
  [MOVE_TYPES.BLOCK]: 3,
  [MOVE_TYPES.JUMP]: 8,
  [MOVE_TYPES.FORWARD_JUMP]: 8,
  [MOVE_TYPES.BACKWARD_JUMP]: 8,
  [MOVE_TYPES.ENDURE]: 3,
  [MOVE_TYPES.SQUAT_ENDURE]: 3,
  [MOVE_TYPES.KNOCK_DOWN]: 10,
  [MOVE_TYPES.ATTRACTIVE_STAND_UP]: 4,
  [MOVE_TYPES.FALL]: 7,
  [MOVE_TYPES.WIN]: 10,
  [MOVE_TYPES.HIGH_KICK]: 13,
  [MOVE_TYPES.LOW_KICK]: 11,
  [MOVE_TYPES.HIGH_PUNCH]: 8,
  [MOVE_TYPES.LOW_PUNCH]: 6,
  [MOVE_TYPES.UPPERCUT]: 9,
  [MOVE_TYPES.SQUAT_LOW_KICK]: 5,
  [MOVE_TYPES.SQUAT_HIGH_KICK]: 7,
  [MOVE_TYPES.SQUAT_LOW_PUNCH]: 5,
  [MOVE_TYPES.SPIN_KICK]: 8,
  [MOVE_TYPES.FORWARD_JUMP_KICK]: 3,
  [MOVE_TYPES.BACKWARD_JUMP_KICK]: 3,
  [MOVE_TYPES.BACKWARD_JUMP_PUNCH]: 3,
  [MOVE_TYPES.FORWARD_JUMP_PUNCH]: 3,
};

export const ORIENTATIONS = { LEFT: 'left', RIGHT: 'right' } as const;
export type Orientation = (typeof ORIENTATIONS)[keyof typeof ORIENTATIONS];

export const KEY_NAMES = {
  UP: 'KeyW', DOWN: 'KeyS', LEFT: 'KeyA', RIGHT: 'KeyD',
  BLOCK: 'ShiftLeft',
  HP: 'KeyR', HK: 'KeyT', LP: 'KeyF', LK: 'KeyG',
} as const;

export const PLAYER_BOTTOM = 360;
export const PLAYER_WIDTH = 60;
export const PLAYER_HEIGHT = 130;
export const ARENA_WIDTH = 600;
export const ARENA_HEIGHT = 400;

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const MOVE_SPEED = 10;
export const JUMP_DELTA_X = 23;
export const JUMP_DELTA_Y = 25;
export const KNOCK_DOWN_DELTA_X = 15;

export const FIGHTER_NAMES = ['subzero', 'kano'] as const;

export const INTERRUPTED_MOVE_TYPES = new Set([
  MOVE_TYPES.STAND, MOVE_TYPES.WALK, MOVE_TYPES.WALK_BACKWARD,
  MOVE_TYPES.SQUAT, MOVE_TYPES.BLOCK,
]);

export const JUMP_MOVE_TYPES = new Set([
  MOVE_TYPES.JUMP, MOVE_TYPES.BACKWARD_JUMP, MOVE_TYPES.FORWARD_JUMP,
]);

export const JUMP_ATTACK_MOVE_TYPES = new Set([
  MOVE_TYPES.FORWARD_JUMP_KICK, MOVE_TYPES.BACKWARD_JUMP_KICK,
  MOVE_TYPES.FORWARD_JUMP_PUNCH, MOVE_TYPES.BACKWARD_JUMP_PUNCH,
]);

export const MOVING_MOVE_TYPES = new Set([
  MOVE_TYPES.WALK, MOVE_TYPES.WALK_BACKWARD,
  MOVE_TYPES.BACKWARD_JUMP, MOVE_TYPES.FORWARD_JUMP,
  MOVE_TYPES.FORWARD_JUMP_KICK, MOVE_TYPES.BACKWARD_JUMP_KICK,
  MOVE_TYPES.FORWARD_JUMP_PUNCH, MOVE_TYPES.BACKWARD_JUMP_PUNCH,
]);

export const ATTACK_MOVE_TYPES = new Set([
  MOVE_TYPES.HIGH_KICK, MOVE_TYPES.LOW_KICK,
  MOVE_TYPES.HIGH_PUNCH, MOVE_TYPES.LOW_PUNCH,
  MOVE_TYPES.UPPERCUT, MOVE_TYPES.SPIN_KICK,
  MOVE_TYPES.SQUAT_LOW_KICK, MOVE_TYPES.SQUAT_HIGH_KICK, MOVE_TYPES.SQUAT_LOW_PUNCH,
  MOVE_TYPES.FORWARD_JUMP_KICK, MOVE_TYPES.BACKWARD_JUMP_KICK,
  MOVE_TYPES.FORWARD_JUMP_PUNCH, MOVE_TYPES.BACKWARD_JUMP_PUNCH,
]);

export const DIR_NONE = 0;
export const DIR_LEFT = 1;
export const DIR_RIGHT = 2;
export const DIR_UP = 3;
export const DIR_DOWN = 4;
export const DIR_UPLEFT = 5;
export const DIR_UPRIGHT = 6;
export const DIR_DOWNLEFT = 7;
export const DIR_DOWNRIGHT = 8;

export const BUF_SIZE = 24;

export interface FighterState {
  name: string;
  x: number;
  y: number;
  orientation: Orientation;
  hp: number;
  maxHp: number;
  moveType: MoveType;
  currentStep: number;
  stateTimer: number;
  damage: number;
  height: number;
  width: number;
  jumpStep: number;
  jumpTotal: number;
  motionBuf: number[];
  motionHead: number;
  comboDamage: number;
  comboKnockDown: boolean;
}

export interface GameState {
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

export interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

export interface RoomInfo {
  code: string;
  bestOf: number;
  player1: PlayerInfo;
  player2: PlayerInfo | null;
}

export type FightingScreen = 'menu' | 'lobby' | 'countdown' | 'playing' | 'round_end' | 'match_end';
