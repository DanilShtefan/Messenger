import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SnakeGame.module.css';

const GRID_W = 20;
const GRID_H = 20;
const CELL = 20;
const CANVAS_W = GRID_W * CELL;
const CANVAS_H = GRID_H * CELL;
const TICK_MS = 150;

type Dir = 'up' | 'down' | 'left' | 'right';
type Segment = [number, number];

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
};

function randomFood(snake: Segment[]): [number, number] {
  const occupied = new Set(snake.map(([x, y]) => `${x},${y}`));
  const free: [number, number][] = [];
  for (let x = 0; x < GRID_W; x++) {
    for (let y = 0; y < GRID_H; y++) {
      if (!occupied.has(`${x},${y}`)) free.push([x, y]);
    }
  }
  if (free.length === 0) return [0, 0];
  return free[Math.floor(Math.random() * free.length)]!;
}

function initSnake(): Segment[] {
  const mid = Math.floor(GRID_W / 2);
  return [[mid, Math.floor(GRID_H / 2)]];
}

export function SnakeGame() {
  const { t } = useTranslation('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Segment[]>(initSnake());
  const foodRef = useRef<[number, number]>([0, 0]);
  const dirRef = useRef<Dir>('right');
  const nextDirRef = useRef<Dir>('right');
  const scoreRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'game_over'>('idle');
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? Number(saved) : 0;
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'game_over'>('idle');
  const gameStateSync = useRef(gameState);
  gameStateSync.current = gameState;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GRID_W; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_H; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(CANVAS_W, y * CELL);
      ctx.stroke();
    }

    // Food
    const [fx, fy] = foodRef.current;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(fx * CELL + CELL / 2, fy * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    const segs = snakeRef.current;
    for (let i = segs.length - 1; i >= 0; i--) {
      const [sx, sy] = segs[i]!;
      const isHead = i === segs.length - 1;
      const ratio = i / segs.length;
      const r = Math.round(99 + ratio * 60);
      const g = Math.round(197 - ratio * 50);
      const b = Math.round(94 - ratio * 30);

      ctx.fillStyle = isHead ? '#22c55e' : `rgb(${r},${g},${b})`;
      ctx.shadowColor = isHead ? '#22c55e' : 'transparent';
      ctx.shadowBlur = isHead ? 6 : 0;
      const pad = 1;
      ctx.fillRect(sx * CELL + pad, sy * CELL + pad, CELL - pad * 2, CELL - pad * 2);
      ctx.shadowBlur = 0;

      if (isHead) {
        // Eyes
        ctx.fillStyle = '#fff';
        const cx = sx * CELL + CELL / 2;
        const cy = sy * CELL + CELL / 2;
        const dir = dirRef.current;
        let ex1 = cx - 3, ey1 = cy - 3, ex2 = cx + 3, ey2 = cy - 3;
        if (dir === 'down') { ex1 = cx - 3; ey1 = cy + 3; ex2 = cx + 3; ey2 = cy + 3; }
        else if (dir === 'left') { ex1 = cx - 3; ey1 = cy - 3; ex2 = cx - 3; ey2 = cy + 3; }
        else if (dir === 'right') { ex1 = cx + 3; ey1 = cy - 3; ex2 = cx + 3; ey2 = cy + 3; }
        ctx.beginPath();
        ctx.arc(ex1, ey1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const tick = useCallback(() => {
    const snake = snakeRef.current;
    const dir = nextDirRef.current;
    dirRef.current = dir;

    const head = snake[snake.length - 1]!;
    let nx = head[0];
    let ny = head[1];
    if (dir === 'up') ny--;
    else if (dir === 'down') ny++;
    else if (dir === 'left') nx--;
    else if (dir === 'right') nx++;

    // Wall collision
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) {
      gameStateRef.current = 'game_over';
      setGameState('game_over');
      const finalScore = scoreRef.current;
      if (finalScore > (Number(localStorage.getItem('snakeHighScore')) || 0)) {
        localStorage.setItem('snakeHighScore', String(finalScore));
        setHighScore(finalScore);
      }
      return;
    }

    // Self collision
    if (snake.some(([sx, sy]) => sx === nx && sy === ny)) {
      gameStateRef.current = 'game_over';
      setGameState('game_over');
      const finalScore = scoreRef.current;
      if (finalScore > (Number(localStorage.getItem('snakeHighScore')) || 0)) {
        localStorage.setItem('snakeHighScore', String(finalScore));
        setHighScore(finalScore);
      }
      return;
    }

    const newSnake = [...snake, [nx, ny] as Segment];
    const [fx, fy] = foodRef.current;

    if (nx === fx && ny === fy) {
      scoreRef.current++;
      setScore(scoreRef.current);
      foodRef.current = randomFood(newSnake);
    } else {
      newSnake.shift();
    }

    snakeRef.current = newSnake;
  }, []);

  const loop = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') {
      draw();
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (time - lastTickRef.current >= TICK_MS) {
      lastTickRef.current = time;
      tick();
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, tick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const map: Record<string, Dir> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
      };
      const dir = map[e.code];
      if (!dir) return;
      e.preventDefault();

      if (gameStateRef.current === 'idle' || gameStateRef.current === 'game_over') return;

      if (dir !== OPPOSITE[dirRef.current]) {
        nextDirRef.current = dir;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  function startGame() {
    snakeRef.current = initSnake();
    foodRef.current = randomFood(initSnake());
    dirRef.current = 'right';
    nextDirRef.current = 'right';
    scoreRef.current = 0;
    setScore(0);
    lastTickRef.current = 0;
    gameStateRef.current = 'playing';
    setGameState('playing');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <span className={styles.score}>{t('games.score')}: {score}</span>
        <span className={styles.highScore}>{t('games.high_score')}: {highScore}</span>
      </div>

      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.controlsHint}>
        <span>↑ ↓ ← → / W A S D</span>
      </div>

      {gameState === 'idle' && (
        <div className={styles.overlay}>
          <span className={styles.overlayTitle}>{t('games.snake')}</span>
          <button className={styles.startBtn} onClick={startGame}>
            {t('games.start')}
          </button>
        </div>
      )}

      {gameState === 'game_over' && (
        <div className={styles.overlay}>
          <span className={styles.overlayTitle}>{t('games.game_over')}</span>
          <span className={styles.overlayScore}>{t('games.score')}: {score}</span>
          <button className={styles.startBtn} onClick={startGame}>
            {t('games.play_again')}
          </button>
        </div>
      )}
    </div>
  );
}
