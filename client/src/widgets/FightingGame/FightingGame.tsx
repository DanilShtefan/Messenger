import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_BOTTOM,
  PLAYER_WIDTH, PLAYER_HEIGHT, IMAGE_COUNT_BY_MOVE_TYPE,
  MOVE_TYPES,
} from './entities';
import styles from './FightingGame.module.css';

interface Props {
  state: GameState;
}

const COLORS = ['#3b82f6', '#ef4444'] as const;
const HP_COLORS = ['#22c55e', '#eab308', '#ef4444'] as const;
const FIGHTER_NAMES = ['subzero', 'kano'] as const;

function getHpColor(ratio: number): string {
  if (ratio > 0.5) return HP_COLORS[0];
  if (ratio > 0.25) return HP_COLORS[1];
  return HP_COLORS[2];
}

function buildSpriteUrl(name: string, orientation: string, moveType: string, step: number): string {
  return `/images/fighters/${name}/${orientation}/${moveType}/${step}.png`;
}

function getSpriteX(fighterX: number, moveType: string, imgWidth: number): number {
  if (moveType === MOVE_TYPES.FALL || moveType === MOVE_TYPES.WIN) {
    return fighterX - imgWidth / 2;
  }
  return fighterX - PLAYER_WIDTH / 2;
}

function getOrCreateImage(cache: Map<string, HTMLImageElement>, url: string): HTMLImageElement | null {
  if (cache.has(url)) {
    const img = cache.get(url)!;
    if (img.complete && img.naturalWidth > 0) return img;
    return null;
  }
  const img = new Image();
  img.src = url;
  cache.set(url, img);
  return null;
}

export function FightingGame({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const { t } = useTranslation('common');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = state;
    const f = gs.fighters;
    const cache = imageCacheRef.current;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const arena = getOrCreateImage(cache, '/images/arena.png');
    if (arena) {
      ctx.drawImage(arena, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, PLAYER_BOTTOM);
    ctx.lineTo(CANVAS_WIDTH, PLAYER_BOTTOM);
    ctx.stroke();

    const barWidth = 200;
    const barHeight = 18;
    const barY = 16;
    const barGap = 30;

    const f0hp = f[0]!.hp;
    const f0maxHp = f[0]!.maxHp;
    const f1hp = f[1]!.hp;
    const f1maxHp = f[1]!.maxHp;

    const p1Ratio = Math.max(0, f0hp / f0maxHp);
    ctx.fillStyle = '#333';
    ctx.fillRect(barGap, barY, barWidth, barHeight);
    ctx.fillStyle = getHpColor(p1Ratio);
    ctx.fillRect(barGap, barY, barWidth * p1Ratio, barHeight);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(barGap, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${f0hp}`, barGap + 6, barY + 13);

    const p2Ratio = Math.max(0, f1hp / f1maxHp);
    const p2BarX = CANVAS_WIDTH - barWidth - barGap;
    ctx.fillStyle = '#333';
    ctx.fillRect(p2BarX, barY, barWidth, barHeight);
    ctx.fillStyle = getHpColor(p2Ratio);
    ctx.fillRect(p2BarX + barWidth * (1 - p2Ratio), barY, barWidth * p2Ratio, barHeight);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(p2BarX, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`${f1hp}`, p2BarX + barWidth - 6, barY + 13);

    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS[0];
    ctx.fillText('P1', barGap, barY - 5);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS[1];
    ctx.fillText('P2', CANVAS_WIDTH - barGap, barY - 5);

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`[ ${gs.scores[0]} - ${gs.scores[1]} ]`, CANVAS_WIDTH / 2, barY - 5);

    const timerSec = Math.ceil(gs.timer / 20);
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = timerSec <= 10 ? '#ef4444' : '#fff';
    ctx.fillText(String(timerSec), CANVAS_WIDTH / 2, barY + barHeight + 22);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`Round ${gs.round}`, CANVAS_WIDTH / 2, barY + barHeight + 38);

    for (let i = 0; i < 2; i++) {
      const fighter = f[i]!;
      const name = FIGHTER_NAMES[i] ?? 'subzero';
      const orient = fighter.orientation;
      const mt = fighter.moveType;
      const step = fighter.currentStep;
      const count = IMAGE_COUNT_BY_MOVE_TYPE[mt] ?? 1;
      const clampedStep = Math.min(step, count - 1);

      const url = buildSpriteUrl(name, orient, mt, clampedStep);
      const img = getOrCreateImage(cache, url);

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(fighter.x, PLAYER_BOTTOM + 3, PLAYER_WIDTH / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (img) {
        const sx = getSpriteX(fighter.x, mt, img.naturalWidth);
        const sy = fighter.y - img.naturalHeight;
        ctx.drawImage(img, sx, sy);
      } else {
        const color = COLORS[i]!;
        const fw = PLAYER_WIDTH;
        const fh = PLAYER_HEIGHT;
        const fx = fighter.x - fw / 2;
        const fy = fighter.y - fh;

        ctx.fillStyle = color;
        ctx.fillRect(fx, fy, fw, fh);

        ctx.beginPath();
        ctx.arc(fighter.x, fy - 4, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      if (mt === MOVE_TYPES.ENDURE || mt === MOVE_TYPES.SQUAT_ENDURE || mt === MOVE_TYPES.KNOCK_DOWN) {
        ctx.fillStyle = 'rgba(255,200,200,0.25)';
        ctx.fillRect(fighter.x - PLAYER_WIDTH / 2, fighter.y - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);
      }

      if (mt === MOVE_TYPES.BLOCK) {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const bx = fighter.orientation === 'left' ? fighter.x + 15 : fighter.x - 15;
        ctx.arc(bx, fighter.y - PLAYER_HEIGHT / 2, PLAYER_WIDTH * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (f[0]!.hp <= 0 || f[1]!.hp <= 0) {
      ctx.fillStyle = 'rgba(255,0,0,0.15)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, [state]);

  const countdownValue = state.status === 'countdown'
    ? Math.ceil(state.countdown / 20)
    : null;

  const fightText = t('games.fight') ?? 'FIGHT!';
  const playerText = t('games.player') ?? 'Player';
  const winsRoundText = t('games.wins_round') ?? 'wins the round!';
  const winsMatchText = t('games.wins_match') ?? 'wins the match!';
  const drawText = t('games.draw') ?? 'Draw!';

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {countdownValue !== null && countdownValue > 0 && (
        <div className={styles.overlay}>
          <span className={styles.countdownText}>
            {countdownValue > 3 ? fightText : countdownValue}
          </span>
        </div>
      )}
      {state.status === 'round_end' && (
        <div className={styles.overlay}>
          <span className={styles.roundEndText}>
            {state.roundWinner !== null
              ? `${playerText} ${state.roundWinner + 1} ${winsRoundText}`
              : drawText}
          </span>
        </div>
      )}
      {state.status === 'match_end' && (
        <div className={styles.overlay}>
          <span className={styles.matchEndText}>
            {`${playerText} ${state.matchWinner! + 1} ${winsMatchText}`}
          </span>
        </div>
      )}
    </div>
  );
}
