export const enum InputFlag {
  NONE = 0,
  LEFT = 1,
  RIGHT = 2,
  JUMP = 4,
  BLOCK = 8,
  PUNCH = 16,
  KICK = 32,
}

export type FighterStatus =
  | 'idle' | 'walk' | 'jump'
  | 'punch' | 'kick' | 'block'
  | 'hit' | 'knocked_down' | 'getup';

export interface FighterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  hp: number;
  maxHp: number;
  status: FighterStatus;
  stateTimer: number;
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

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const GROUND_Y = 370;
export const FIGHTER_WIDTH = 40;
export const FIGHTER_HEIGHT = 60;
