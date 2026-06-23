import { Server, Socket } from 'socket.io';

const TICK_MS = 50;

const PLAYER_BOTTOM = 360;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 130;
const WALL_LEFT = 30;
const WALL_RIGHT = 570;

const MOVE_DELTA_X = 10;
const KNOCK_DOWN_DELTA_X = 15;
const JUMP_DELTA_X = 23;
const JUMP_DELTA_Y = 25;
const BLOCK_DAMAGE_RATIO = 0.2;

const ROUND_TIME_TICKS = 99 * 20;
const COUNTDOWN_TICKS = 90;
const ROUND_END_DELAY_TICKS = 60;

const MOVE_TYPES = {
  STAND: 'stand', WALK: 'walk', WALK_BACKWARD: 'walk-backward',
  SQUAT: 'squat', STAND_UP: 'stand-up', BLOCK: 'block',
  JUMP: 'jump', FORWARD_JUMP: 'forward-jump', BACKWARD_JUMP: 'backward-jump',
  ENDURE: 'endure', SQUAT_ENDURE: 'squat-endure',
  KNOCK_DOWN: 'knock-down', ATTRACTIVE_STAND_UP: 'attractive-stand-up',
  FALL: 'fall', WIN: 'win',
  HIGH_KICK: 'high-kick', LOW_KICK: 'low-kick',
  LOW_PUNCH: 'low-punch', HIGH_PUNCH: 'high-punch',
  UPPERCUT: 'uppercut',
  SQUAT_LOW_KICK: 'squat-low-kick', SQUAT_HIGH_KICK: 'squat-high-kick',
  SQUAT_LOW_PUNCH: 'squat-low-punch', SPIN_KICK: 'spin-kick',
  FORWARD_JUMP_KICK: 'forward-jump-kick', BACKWARD_JUMP_KICK: 'backward-jump-kick',
  BACKWARD_JUMP_PUNCH: 'backward-jump-punch', FORWARD_JUMP_PUNCH: 'forward-jump-punch',
} as const;

type MoveType = (typeof MOVE_TYPES)[keyof typeof MOVE_TYPES];

const ORIENTATIONS = { LEFT: 'left', RIGHT: 'right' } as const;
type Orientation = (typeof ORIENTATIONS)[keyof typeof ORIENTATIONS];

const INTERRUPTED: ReadonlySet<MoveType> = new Set([
  MOVE_TYPES.STAND, MOVE_TYPES.WALK, MOVE_TYPES.WALK_BACKWARD,
  MOVE_TYPES.SQUAT, MOVE_TYPES.BLOCK,
]);

const JUMP_TYPES: ReadonlySet<MoveType> = new Set([
  MOVE_TYPES.JUMP, MOVE_TYPES.FORWARD_JUMP, MOVE_TYPES.BACKWARD_JUMP,
]);

const JUMP_ATTACK_TYPES: ReadonlySet<MoveType> = new Set([
  MOVE_TYPES.FORWARD_JUMP_KICK, MOVE_TYPES.BACKWARD_JUMP_KICK,
  MOVE_TYPES.FORWARD_JUMP_PUNCH, MOVE_TYPES.BACKWARD_JUMP_PUNCH,
]);

const MOVING_TYPES: ReadonlySet<MoveType> = new Set([
  MOVE_TYPES.WALK, MOVE_TYPES.WALK_BACKWARD,
  MOVE_TYPES.BACKWARD_JUMP, MOVE_TYPES.FORWARD_JUMP,
  MOVE_TYPES.FORWARD_JUMP_KICK, MOVE_TYPES.BACKWARD_JUMP_KICK,
  MOVE_TYPES.FORWARD_JUMP_PUNCH, MOVE_TYPES.BACKWARD_JUMP_PUNCH,
]);

interface MoveInfo {
  totalSteps: number;
  stepDuration: number;
  nextType: MoveType;
  nextStep: number;
  loop: boolean;
  holdLast: boolean;
  height: number | null;
  damage: number;
  damageWidth: number;
  damageHeight: number;
  damageYOffset: number;
  moveX: number;
  knockDown: boolean;
  jumpAttack: boolean;
}

const MOVE_DATA: Record<string, MoveInfo> = {};
function def(m: MoveType, data: Partial<MoveInfo>): void {
  MOVE_DATA[m] = {
    totalSteps: 1, stepDuration: 80, nextType: MOVE_TYPES.STAND, nextStep: 0,
    loop: false, holdLast: false, height: null,
    damage: 0, damageWidth: PLAYER_WIDTH * 0.8, damageHeight: PLAYER_HEIGHT * 0.4, damageYOffset: 0,
    moveX: 0, knockDown: false, jumpAttack: false,
    ...data,
  };
}

def(MOVE_TYPES.STAND,          { totalSteps: 9,  loop: true });
def(MOVE_TYPES.WALK,           { totalSteps: 9,  loop: true, moveX: MOVE_DELTA_X });
def(MOVE_TYPES.WALK_BACKWARD,  { totalSteps: 9,  loop: true, moveX: -MOVE_DELTA_X });
def(MOVE_TYPES.SQUAT,          { totalSteps: 3,  stepDuration: 40, holdLast: true, height: PLAYER_HEIGHT / 2 });
def(MOVE_TYPES.STAND_UP,       { totalSteps: 3,  stepDuration: 40, height: PLAYER_HEIGHT });
def(MOVE_TYPES.BLOCK,          { totalSteps: 3,  stepDuration: 40, holdLast: true, height: PLAYER_HEIGHT });
def(MOVE_TYPES.JUMP,           { totalSteps: 8,  height: PLAYER_HEIGHT / 2 });
def(MOVE_TYPES.FORWARD_JUMP,   { totalSteps: 8,  height: PLAYER_HEIGHT / 2, moveX: JUMP_DELTA_X });
def(MOVE_TYPES.BACKWARD_JUMP,  { totalSteps: 8,  height: PLAYER_HEIGHT / 2, moveX: -JUMP_DELTA_X });
def(MOVE_TYPES.ENDURE,         { totalSteps: 3 });
def(MOVE_TYPES.SQUAT_ENDURE,   { totalSteps: 3,  nextType: MOVE_TYPES.SQUAT, nextStep: 2 });
def(MOVE_TYPES.KNOCK_DOWN,     { totalSteps: 10, nextType: MOVE_TYPES.ATTRACTIVE_STAND_UP, moveX: -KNOCK_DOWN_DELTA_X });
def(MOVE_TYPES.ATTRACTIVE_STAND_UP, { totalSteps: 4, height: PLAYER_HEIGHT });
def(MOVE_TYPES.FALL,           { totalSteps: 7,  holdLast: true });
def(MOVE_TYPES.WIN,            { totalSteps: 10, holdLast: true });
def(MOVE_TYPES.HIGH_KICK,      { totalSteps: 13, stepDuration: 60, damage: 10, damageYOffset: PLAYER_HEIGHT * 0.7, damageWidth: PLAYER_WIDTH * 0.8 });
def(MOVE_TYPES.LOW_KICK,       { totalSteps: 11, stepDuration: 60, damage: 6,  damageYOffset: PLAYER_HEIGHT * 0.4, damageWidth: PLAYER_WIDTH * 1.2 });
def(MOVE_TYPES.HIGH_PUNCH,     { totalSteps: 8,  stepDuration: 60, damage: 8,  damageYOffset: PLAYER_HEIGHT * 0.7, damageWidth: PLAYER_WIDTH * 0.8 });
def(MOVE_TYPES.LOW_PUNCH,      { totalSteps: 6,  stepDuration: 60, damage: 5,  damageYOffset: PLAYER_HEIGHT * 0.6 });
def(MOVE_TYPES.UPPERCUT,       { totalSteps: 9,  stepDuration: 60, damage: 13, damageYOffset: PLAYER_HEIGHT * 0.7, damageWidth: PLAYER_WIDTH * 0.8, damageHeight: PLAYER_HEIGHT * 1.2, nextType: MOVE_TYPES.SQUAT, nextStep: 2, knockDown: true, height: PLAYER_HEIGHT });
def(MOVE_TYPES.SQUAT_LOW_KICK, { totalSteps: 5,  stepDuration: 70, damage: 4,  damageWidth: PLAYER_WIDTH * 1.2,                  nextType: MOVE_TYPES.SQUAT, nextStep: 2 });
def(MOVE_TYPES.SQUAT_HIGH_KICK,{ totalSteps: 7,  stepDuration: 70, damage: 6,  damageYOffset: PLAYER_HEIGHT * 0.4, damageWidth: PLAYER_WIDTH * 0.7, nextType: MOVE_TYPES.SQUAT, nextStep: 2 });
def(MOVE_TYPES.SQUAT_LOW_PUNCH,{ totalSteps: 5,  stepDuration: 70, damage: 4,  damageYOffset: PLAYER_HEIGHT * 0.3, damageWidth: PLAYER_WIDTH * 0.6, nextType: MOVE_TYPES.SQUAT, nextStep: 2 });
def(MOVE_TYPES.SPIN_KICK,      { totalSteps: 8,  stepDuration: 60, damage: 13, damageYOffset: PLAYER_HEIGHT * 0.6, damageWidth: PLAYER_WIDTH * 0.9, knockDown: true });
for (const mt of [MOVE_TYPES.FORWARD_JUMP_KICK, MOVE_TYPES.BACKWARD_JUMP_KICK]) {
  def(mt, { totalSteps: 3, stepDuration: 80, damage: 10, jumpAttack: true });
}
for (const mt of [MOVE_TYPES.FORWARD_JUMP_PUNCH, MOVE_TYPES.BACKWARD_JUMP_PUNCH]) {
  def(mt, { totalSteps: 3, stepDuration: 80, damage: 8, jumpAttack: true });
}

const DIR_NONE = 0;
const DIR_LEFT = 1;
const DIR_RIGHT = 2;
const DIR_UP = 3;
const DIR_DOWN = 4;
const DIR_UPLEFT = 5;
const DIR_UPRIGHT = 6;
const DIR_DOWNLEFT = 7;
const DIR_DOWNRIGHT = 8;

const BUF_SIZE = 24;

interface FighterState {
  name: string;
  x: number; y: number;
  orientation: Orientation;
  hp: number; maxHp: number;
  moveType: MoveType;
  currentStep: number;
  stepAcc: number;
  damage: number;
  height: number; width: number;
  jumpStep: number;
  jumpTotal: number;
  motionBuf: number[];
  motionHead: number;
  comboDamage: number;
  comboKnockDown: boolean;
}

interface GameState {
  fighters: [FighterState, FighterState];
  round: number; totalRounds: number;
  scores: [number, number];
  timer: number;
  status: 'countdown' | 'playing' | 'round_end' | 'match_end';
  roundWinner: number | null;
  matchWinner: number | null;
  countdown: number;
}

interface PlayerInput {
  pressed: Set<string>;
  justPressed: Set<string>;
}

interface GameRoom {
  code: string; bestOf: number; totalRounds: number;
  player1Id: string; player1Name: string;
  player2Id: string | null; player2Name: string | null;
  player1Ready: boolean; player2Ready: boolean;
  state: GameState | null;
  interval: ReturnType<typeof setInterval> | null;
  inputs: [PlayerInput, PlayerInput];
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

function createFighter(name: string, x: number): FighterState {
  return {
    name, x, y: PLAYER_BOTTOM,
    orientation: 'right',
    hp: 100, maxHp: 100,
    moveType: MOVE_TYPES.STAND,
    currentStep: 0, stepAcc: 0,
    damage: 0,
    height: PLAYER_HEIGHT, width: PLAYER_WIDTH,
    jumpStep: 0, jumpTotal: 8,
    motionBuf: new Array(BUF_SIZE).fill(DIR_NONE),
    motionHead: 0,
    comboDamage: 0,
    comboKnockDown: false,
  };
}

function freshState(totalRounds: number): GameState {
  return {
    fighters: [createFighter('subzero', 100), createFighter('kano', 500)],
    round: 1, totalRounds,
    scores: [0, 0],
    timer: ROUND_TIME_TICKS,
    status: 'countdown',
    roundWinner: null, matchWinner: null,
    countdown: COUNTDOWN_TICKS,
  };
}

function isJump(mt: MoveType): boolean { return JUMP_TYPES.has(mt); }
function isJumpAttack(mt: MoveType): boolean { return JUMP_ATTACK_TYPES.has(mt); }
function isMoving(mt: MoveType): boolean { return MOVING_TYPES.has(mt); }
function canInterrupt(mt: MoveType): boolean { return INTERRUPTED.has(mt); }

function getMoveInfo(mt: MoveType): MoveInfo {
  return MOVE_DATA[mt]!;
}

const KEYS_CONFIG = [
  { UP: 'KeyW', DOWN: 'KeyS', LEFT: 'KeyA', RIGHT: 'KeyD', BLOCK: 'ShiftLeft', HP: 'KeyR', HK: 'KeyT', LP: 'KeyF', LK: 'KeyG' },
];

function determineMove(fighter: FighterState, justPressed: Set<string>, pressed: Set<string>, keys: typeof KEYS_CONFIG[0]): MoveType | null {
  const cmt = fighter.moveType;

  // Jump attack cancel
  if (cmt === MOVE_TYPES.FORWARD_JUMP || cmt === MOVE_TYPES.BACKWARD_JUMP) {
    if (justPressed.has(keys.HK) || justPressed.has(keys.LK)) {
      return cmt === MOVE_TYPES.FORWARD_JUMP ? MOVE_TYPES.FORWARD_JUMP_KICK : MOVE_TYPES.BACKWARD_JUMP_KICK;
    }
    if (justPressed.has(keys.HP) || justPressed.has(keys.LP)) {
      return cmt === MOVE_TYPES.FORWARD_JUMP ? MOVE_TYPES.FORWARD_JUMP_PUNCH : MOVE_TYPES.BACKWARD_JUMP_PUNCH;
    }
  }

  // Diagonal jumps
  if (pressed.has(keys.UP) && pressed.has(keys.LEFT)) return MOVE_TYPES.BACKWARD_JUMP;
  if (pressed.has(keys.UP) && pressed.has(keys.RIGHT)) return MOVE_TYPES.FORWARD_JUMP;

  // Spin kick
  if (justPressed.has(keys.HK) && pressed.has(keys.LEFT) && fighter.orientation === 'left') return MOVE_TYPES.SPIN_KICK;
  if (justPressed.has(keys.HK) && pressed.has(keys.RIGHT) && fighter.orientation === 'right') return MOVE_TYPES.SPIN_KICK;

  // Crouching attacks
  if (pressed.has(keys.DOWN) && justPressed.has(keys.HP)) return MOVE_TYPES.UPPERCUT;
  if (pressed.has(keys.DOWN) && justPressed.has(keys.LP)) return MOVE_TYPES.SQUAT_LOW_PUNCH;
  if (pressed.has(keys.DOWN) && justPressed.has(keys.HK)) return MOVE_TYPES.SQUAT_HIGH_KICK;
  if (pressed.has(keys.DOWN) && justPressed.has(keys.LK)) return MOVE_TYPES.SQUAT_LOW_KICK;

  // Basic attacks
  if (justPressed.has(keys.HK)) return MOVE_TYPES.HIGH_KICK;
  if (justPressed.has(keys.LK)) return MOVE_TYPES.LOW_KICK;
  if (justPressed.has(keys.HP)) return MOVE_TYPES.HIGH_PUNCH;
  if (justPressed.has(keys.LP)) return MOVE_TYPES.LOW_PUNCH;

  return null;
}

function determineHoldMove(pressed: Set<string>, keys: typeof KEYS_CONFIG[0]): MoveType | null {
  if (pressed.has(keys.BLOCK)) return MOVE_TYPES.BLOCK;
  if (pressed.has(keys.UP) && pressed.has(keys.LEFT)) return MOVE_TYPES.BACKWARD_JUMP;
  if (pressed.has(keys.UP) && pressed.has(keys.RIGHT)) return MOVE_TYPES.FORWARD_JUMP;
  if (pressed.has(keys.LEFT)) return MOVE_TYPES.WALK_BACKWARD;
  if (pressed.has(keys.RIGHT)) return MOVE_TYPES.WALK;
  if (pressed.has(keys.DOWN)) return MOVE_TYPES.SQUAT;
  if (pressed.has(keys.UP)) return MOVE_TYPES.JUMP;
  return MOVE_TYPES.STAND;
}

function setMove(fighter: FighterState, newMt: MoveType, startStep = 0): void {
  if (fighter.moveType === newMt) return;

  // Jump attack: preserve arc progress
  if (isJumpAttack(newMt)) {
    const js = fighter.jumpStep;
    const jt = fighter.jumpTotal;
    const jy = fighter.y;
    fighter.moveType = newMt;
    fighter.currentStep = 0;
    fighter.stepAcc = 0;
    fighter.y = jy;
    fighter.jumpStep = js;
    fighter.jumpTotal = jt;
    const mi = getMoveInfo(newMt);
    if (mi.height !== null) fighter.height = mi.height;
    return;
  }

  if (!canInterrupt(fighter.moveType)) return;

  applyMoveConfig(fighter, newMt, startStep);
}

function forceMove(fighter: FighterState, newMt: MoveType, startStep = 0): void {
  if (fighter.moveType === newMt) return;
  applyMoveConfig(fighter, newMt, startStep);
}

function applyMoveConfig(fighter: FighterState, newMt: MoveType, startStep: number): void {
  fighter.moveType = newMt;
  fighter.currentStep = startStep;
  fighter.stepAcc = 0;
  fighter.damage = 0;

  const mi = getMoveInfo(newMt);
  fighter.height = mi.height ?? PLAYER_HEIGHT;

  if (JUMP_TYPES.has(newMt)) {
    fighter.jumpTotal = mi.totalSteps;
    fighter.jumpStep = 0;
  }
}

function applyStepEffects(fighter: FighterState): void {
  const mi = getMoveInfo(fighter.moveType);

  // Walk/knockdown/forward-jump horizontal movement
  if (mi.moveX !== 0) {
    if (fighter.moveType === MOVE_TYPES.KNOCK_DOWN) {
      fighter.x += fighter.orientation === 'left' ? -KNOCK_DOWN_DELTA_X : KNOCK_DOWN_DELTA_X;
    } else {
      fighter.x += mi.moveX;
    }
  }

  // Jump attack horizontal movement
  if (mi.jumpAttack) {
    const forward = fighter.moveType === MOVE_TYPES.FORWARD_JUMP_KICK || fighter.moveType === MOVE_TYPES.FORWARD_JUMP_PUNCH;
    fighter.x += forward ? JUMP_DELTA_X : -JUMP_DELTA_X;
  }

  // Jump arc
  if (JUMP_TYPES.has(fighter.moveType) || JUMP_ATTACK_TYPES.has(fighter.moveType)) {
    const isJA = JUMP_ATTACK_TYPES.has(fighter.moveType);
    const js = isJA ? fighter.jumpStep : fighter.currentStep;

    if (isJA) {
      if (js === 0)
        fighter.y = PLAYER_BOTTOM - PLAYER_HEIGHT * 0.9;
      else if (js < fighter.jumpTotal / 2)
        fighter.y -= JUMP_DELTA_Y;
      else
        fighter.y += JUMP_DELTA_Y;
    } else {
      if (js === 0) return;
      if (js === 1)
        fighter.y = PLAYER_BOTTOM - PLAYER_HEIGHT * 0.9;
      else if (js < fighter.jumpTotal / 2)
        fighter.y -= JUMP_DELTA_Y;
      else
        fighter.y += JUMP_DELTA_Y;
    }
  }

  // Set damage at midpoint frame
  if (mi.damage > 0 && fighter.currentStep === Math.floor(mi.totalSteps / 2)) {
    fighter.damage = mi.damage;
  }
}

function finishMove(fighter: FighterState, nextType: MoveType): void {
  fighter.moveType = nextType;
  fighter.currentStep = 0;
  fighter.stepAcc = 0;
  fighter.damage = 0;
  fighter.y = PLAYER_BOTTOM;
  fighter.height = getMoveInfo(nextType).height ?? PLAYER_HEIGHT;
}

function advanceFrame(fighter: FighterState): void {
  const mi = getMoveInfo(fighter.moveType);

  if (mi.jumpAttack) {
    fighter.currentStep++;
    if (fighter.currentStep >= mi.totalSteps) fighter.currentStep = mi.totalSteps - 1;
    fighter.jumpStep++;
    applyStepEffects(fighter);
    if (fighter.jumpStep >= fighter.jumpTotal) {
      finishMove(fighter, MOVE_TYPES.STAND);
    }
    return;
  }

  fighter.currentStep++;
  applyStepEffects(fighter);

  if (mi.loop) {
    fighter.currentStep %= mi.totalSteps;
    return;
  }

  if (mi.holdLast && fighter.currentStep >= mi.totalSteps) {
    fighter.currentStep = mi.totalSteps - 1;
    return;
  }

  if (fighter.currentStep >= mi.totalSteps) {
    finishMove(fighter, mi.nextType);
  }
}

function checkDistanceForAttack(fighter: FighterState, opponent: FighterState): boolean {
  const mi = getMoveInfo(fighter.moveType);
  const damageX = fighter.orientation === 'left'
    ? fighter.x + PLAYER_WIDTH / 2 + mi.damageWidth / 2
    : fighter.x - PLAYER_WIDTH / 2 - mi.damageWidth / 2;
  const damageY = fighter.y - mi.damageYOffset;

  const intersectX = Math.abs(opponent.x - damageX) < (opponent.width + mi.damageWidth) / 2;
  const oppCenterY = opponent.y - opponent.height / 2;
  const dmgCenterY = damageY - mi.damageHeight / 2;
  const intersectY = Math.abs(oppCenterY - dmgCenterY) < (opponent.height + mi.damageHeight) / 2;
  return intersectX && intersectY;
}

function applyDamage(defender: FighterState, damage: number, attackType: MoveType, forceKnockDown = false): void {
  if (defender.hp <= 0) return;
  let dmg = damage;
  let newMt: MoveType;

  if (defender.moveType === MOVE_TYPES.BLOCK) {
    dmg = Math.floor(damage * BLOCK_DAMAGE_RATIO);
    if (dmg <= 0) dmg = 1;
  }

  if (defender.moveType === MOVE_TYPES.BLOCK) {
    defender.hp = Math.max(defender.hp - dmg, 0);
    return;
  }

  if (forceKnockDown) {
    newMt = MOVE_TYPES.KNOCK_DOWN;
  } else if (defender.moveType === MOVE_TYPES.SQUAT || defender.moveType === MOVE_TYPES.SQUAT_ENDURE ||
      defender.moveType === MOVE_TYPES.SQUAT_LOW_KICK || defender.moveType === MOVE_TYPES.SQUAT_HIGH_KICK ||
      defender.moveType === MOVE_TYPES.SQUAT_LOW_PUNCH || defender.moveType === MOVE_TYPES.STAND_UP) {
    newMt = MOVE_TYPES.SQUAT_ENDURE;
  } else if (attackType === MOVE_TYPES.UPPERCUT || attackType === MOVE_TYPES.SPIN_KICK) {
    newMt = MOVE_TYPES.KNOCK_DOWN;
  } else {
    newMt = MOVE_TYPES.ENDURE;
  }

  defender.hp = Math.max(defender.hp - dmg, 0);
  defender.moveType = newMt;
  defender.currentStep = 0;
  defender.stepAcc = 0;
  defender.damage = 0;
  defender.height = getMoveInfo(newMt).height ?? PLAYER_HEIGHT;
}

function checkAttacks(f1: FighterState, f2: FighterState): void {
  checkSingle(f1, f2);
  checkSingle(f2, f1);
}

function checkSingle(attacker: FighterState, defender: FighterState): void {
  if (attacker.damage > 0 && checkDistanceForAttack(attacker, defender)) {
    const dmg = attacker.comboDamage > 0 ? attacker.comboDamage : attacker.damage;
    const kd = attacker.comboKnockDown;
    applyDamage(defender, dmg, attacker.moveType, kd);
    attacker.damage = 0;
    attacker.comboDamage = 0;
    attacker.comboKnockDown = false;
  }
}

function autoFace(fighter: FighterState, opponent: FighterState): void {
  if (isJump(fighter.moveType) || isJumpAttack(fighter.moveType)) return;
  fighter.orientation = fighter.x < opponent.x ? 'left' : 'right';
}

function clampToBounds(fighter: FighterState): void {
  if (fighter.x < WALL_LEFT) fighter.x = WALL_LEFT;
  if (fighter.x > WALL_RIGHT) fighter.x = WALL_RIGHT;
}

function resolveCollision(f1: FighterState, f2: FighterState): void {
  const oneJump = isJump(f1.moveType) || isJumpAttack(f1.moveType);
  const twoJump = isJump(f2.moveType) || isJumpAttack(f2.moveType);
  if (oneJump !== twoJump) return;

  const dx = Math.abs(f2.x - f1.x);
  const overlap = (f1.width + f2.width) / 2 - dx;
  if (overlap <= 0) return;

  const f1Moving = isMoving(f1.moveType);
  const f2Moving = isMoving(f2.moveType);

  if (!f1Moving && !f2Moving) return;

  if (!f2Moving) {
    f1.x = f1.orientation === 'left'
      ? f2.x - (f1.width + f2.width) / 2
      : f2.x + (f1.width + f2.width) / 2;
    clampToBounds(f1);
    return;
  }

  if (!f1Moving) {
    f2.x = f2.orientation === 'left'
      ? f1.x - (f1.width + f2.width) / 2
      : f1.x + (f1.width + f2.width) / 2;
    clampToBounds(f2);
    return;
  }

  const halfOverlap = overlap / 2;
  if (f1.x < f2.x) {
    f1.x -= halfOverlap;
    f2.x += halfOverlap;
  } else {
    f1.x += halfOverlap;
    f2.x -= halfOverlap;
  }
  clampToBounds(f1);
  clampToBounds(f2);
}

function getDir(pressed: Set<string>, keys: typeof KEYS_CONFIG[0]): number {
  const l = pressed.has(keys.LEFT);
  const r = pressed.has(keys.RIGHT);
  const u = pressed.has(keys.UP);
  const d = pressed.has(keys.DOWN);
  if (l && u) return DIR_UPLEFT;
  if (r && u) return DIR_UPRIGHT;
  if (l && d) return DIR_DOWNLEFT;
  if (r && d) return DIR_DOWNRIGHT;
  if (l) return DIR_LEFT;
  if (r) return DIR_RIGHT;
  if (u) return DIR_UP;
  if (d) return DIR_DOWN;
  return DIR_NONE;
}

function recordMotion(fighter: FighterState, dir: number): void {
  const prev = fighter.motionBuf[(fighter.motionHead - 1 + BUF_SIZE) % BUF_SIZE]!;
  if (dir !== prev && !(dir === DIR_NONE && prev === DIR_NONE)) {
    fighter.motionBuf[fighter.motionHead] = dir;
    fighter.motionHead = (fighter.motionHead + 1) % BUF_SIZE;
  }
}

function readBuf(buf: number[], head: number, offset: number): number {
  return buf[(head - 1 - offset + BUF_SIZE) % BUF_SIZE]!;
}

function matchesMotion(buf: number[], head: number, pattern: number[], tolerance: number): boolean {
  let bi = 0;
  for (let pi = 0; pi < pattern.length && bi < BUF_SIZE; pi++) {
    let found = false;
    for (let t = 0; t <= tolerance && bi + t < BUF_SIZE; t++) {
      if (readBuf(buf, head, bi + t) === pattern[pi]) {
        bi += t + 1;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

interface ComboMatch {
  damage: number;
  knockDown: boolean;
}

function checkCombo(fighter: FighterState, justPressed: Set<string>, keys: typeof KEYS_CONFIG[0]): ComboMatch | null {
  const buf = fighter.motionBuf;
  const head = fighter.motionHead;
  const hp = justPressed.has(keys.HP);
  const lp = justPressed.has(keys.LP);
  const hk = justPressed.has(keys.HK);
  const lk = justPressed.has(keys.LK);

  // ↓→ + HP (quarter circle forward + HP) — Power Strike, 15 dmg
  if (hp && matchesMotion(buf, head, [DIR_DOWN, DIR_DOWNRIGHT, DIR_RIGHT], 2))
    return { damage: 15, knockDown: true };
  // ↓→ + HK — Spinning Kick, 14 dmg
  if (hk && matchesMotion(buf, head, [DIR_DOWN, DIR_DOWNRIGHT, DIR_RIGHT], 2))
    return { damage: 14, knockDown: true };
  // →↓→ + LP (dragon punch motion + LP) — Dragon Uppercut, 18 dmg
  if (lp && matchesMotion(buf, head, [DIR_RIGHT, DIR_DOWN, DIR_DOWNRIGHT], 2))
    return { damage: 18, knockDown: true };
  // ↓← + LK (quarter circle back + LK) — Sweep, 10 dmg
  if (lk && matchesMotion(buf, head, [DIR_DOWN, DIR_DOWNLEFT, DIR_LEFT], 2))
    return { damage: 10, knockDown: true };

  return null;
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
      gs.fighters = [createFighter('subzero', 100), createFighter('kano', 500)];
      gs.timer = ROUND_TIME_TICKS;
      gs.countdown = COUNTDOWN_TICKS;
      gs.status = 'countdown';
      gs.roundWinner = null;
      room.inputs = [newPlayerInput(), newPlayerInput()];
    }
    return;
  }

  if (gs.status !== 'playing') return;

  const [f1, f2] = gs.fighters;
  const [inpP1, inpP2] = room.inputs;

  // --- Process input for each fighter ---
  for (let i = 0; i < 2; i++) {
    const fighter = gs.fighters[i]!;
    const opponent = gs.fighters[1 - i]!;
    const inp = i === 0 ? inpP1 : inpP2;
    const keys = KEYS_CONFIG[0]!;

    autoFace(fighter, opponent);

    // Record motion direction from held keys
    const dir = getDir(inp.pressed, keys);
    recordMotion(fighter, dir);

    if (canInterrupt(fighter.moveType)) {
      // Check for death
      if (fighter.hp <= 0) {
        forceMove(fighter, MOVE_TYPES.FALL);
        forceMove(opponent, MOVE_TYPES.WIN);
        continue;
      }

      // Stand up from squat
      if (fighter.moveType === MOVE_TYPES.SQUAT && !inp.pressed.has(keys.DOWN)) {
        setMove(fighter, MOVE_TYPES.STAND_UP);
      }

      // Check for combo moves from justPressed attacks
      const combo = checkCombo(fighter, inp.justPressed, keys);
      if (combo) {
        fighter.comboDamage = combo.damage;
        fighter.comboKnockDown = combo.knockDown;
      }

      // Determine new move from justPressed (attacks)
      const attackMove = determineMove(fighter, inp.justPressed, inp.pressed, keys);
      if (attackMove) setMove(fighter, attackMove);

      // Determine hold move (movement, block, squat, jump)
      const holdMove = determineHoldMove(inp.pressed, keys);
      if (holdMove && fighter.moveType !== MOVE_TYPES.STAND_UP) setMove(fighter, holdMove);
    } else {
      // Non-interruptible: check for jump attack cancel
      if (JUMP_TYPES.has(fighter.moveType)) {
        const attackMove = determineMove(fighter, inp.justPressed, inp.pressed, keys);
        if (attackMove && isJumpAttack(attackMove)) setMove(fighter, attackMove);
      }
    }

    // Clear justPressed for next tick
    inp.justPressed.clear();
  }

  // --- Advance moves & apply effects ---
  for (let i = 0; i < 2; i++) {
    const fighter = gs.fighters[i]!;
    const mi = getMoveInfo(fighter.moveType);

    // Advance step by accumulator
    fighter.stepAcc += TICK_MS;
    while (fighter.stepAcc >= mi.stepDuration) {
      fighter.stepAcc -= mi.stepDuration;
      advanceFrame(fighter);
    }

    clampToBounds(fighter);
  }

  // --- Collision ---
  resolveCollision(f1, f2);

  // --- Attack detection ---
  checkAttacks(f1, f2);

  // --- Check death ---
  if (f1.hp <= 0 && f2.hp > 0) {
    forceMove(f1, MOVE_TYPES.FALL);
    forceMove(f2, MOVE_TYPES.WIN);
  } else if (f2.hp <= 0 && f1.hp > 0) {
    forceMove(f2, MOVE_TYPES.FALL);
    forceMove(f1, MOVE_TYPES.WIN);
  } else if (f1.hp <= 0 && f2.hp <= 0) {
    forceMove(f1, MOVE_TYPES.FALL);
    forceMove(f2, MOVE_TYPES.FALL);
  }

  // --- Round logic ---
  gs.timer--;
  if (gs.timer <= 0 || f1.hp <= 0 || f2.hp <= 0) {
    let winner: number | null = null;
    if (f1.hp <= 0 && f2.hp > 0) winner = 1;
    else if (f2.hp <= 0 && f1.hp > 0) winner = 0;
    else if (f1.hp > f2.hp) winner = 0;
    else if (f2.hp > f1.hp) winner = 1;

    const scores: [number, number] = [...gs.scores];
    if (winner !== null) scores[winner]!++;

    const needed = Math.ceil(gs.totalRounds / 2);
    const matchWinner = scores[0]! >= needed ? 0 : scores[1]! >= needed ? 1 : null;

    gs.scores = scores;
    gs.roundWinner = winner;
    gs.round++;
    gs.status = matchWinner !== null ? 'match_end' : 'round_end';
    if (gs.status === 'round_end') gs.countdown = ROUND_END_DELAY_TICKS;
    gs.matchWinner = matchWinner;
  }
}

function startGameLoop(room: GameRoom, io: Server): void {
  if (room.interval) clearInterval(room.interval);
  room.state = freshState(room.totalRounds);
  room.inputs = [newPlayerInput(), newPlayerInput()];
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

function newPlayerInput(): PlayerInput {
  return { pressed: new Set(), justPressed: new Set() };
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
      code, bestOf, totalRounds: bestOf,
      player1Id: userId,
      player1Name: data?.displayName || 'Player 1',
      player2Id: null, player2Name: null,
      player1Ready: false, player2Ready: false,
      state: null, interval: null,
      inputs: [newPlayerInput(), newPlayerInput()],
      running: false,
    };
    rooms.set(code, room);
    socket.join(`fighting:${code}`);
    socket.emit('fighting:created', {
      code, playerIndex: 0,
      room: {
        code, bestOf: room.bestOf,
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
      code: room.code, bestOf: room.bestOf,
      player1: { id: room.player1Id, name: room.player1Name, ready: room.player1Ready },
      player2: { id: room.player2Id, name: room.player2Name, ready: room.player2Ready },
    };

    socket.emit('fighting:joined', {
      opponent: room.player1Name, bestOf: room.bestOf, room: info, playerIndex: 1,
    });
    socket.to(`fighting:${room.code}`).emit('fighting:opponent_joined', {
      opponent: room.player2Name, room: info,
    });
  });

  socket.on('fighting:ready', () => {
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        room.player1Ready = !room.player1Ready;
        io.to(`fighting:${room.code}`).emit('fighting:ready_update', {
          player1Ready: room.player1Ready, player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player2Id) startGameLoop(room, io);
        return;
      }
      if (room.player2Id === userId) {
        room.player2Ready = !room.player2Ready;
        io.to(`fighting:${room.code}`).emit('fighting:ready_update', {
          player1Ready: room.player1Ready, player2Ready: room.player2Ready,
        });
        if (room.player1Ready && room.player2Ready && room.player1Id) startGameLoop(room, io);
        return;
      }
    }
  });

  socket.on('fighting:keydown', (data: { code: string }) => {
    const code = data?.code;
    if (!code) return;
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        if (!room.inputs[0]!.pressed.has(code)) {
          room.inputs[0]!.pressed.add(code);
          room.inputs[0]!.justPressed.add(code);
        }
        return;
      }
      if (room.player2Id === userId) {
        if (!room.inputs[1]!.pressed.has(code)) {
          room.inputs[1]!.pressed.add(code);
          room.inputs[1]!.justPressed.add(code);
        }
        return;
      }
    }
  });

  socket.on('fighting:keyup', (data: { code: string }) => {
    const code = data?.code;
    if (!code) return;
    for (const room of rooms.values()) {
      if (room.player1Id === userId) {
        room.inputs[0]!.pressed.delete(code);
        return;
      }
      if (room.player2Id === userId) {
        room.inputs[1]!.pressed.delete(code);
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
