import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT } from './entities';
import styles from './FightingGame.module.css';

interface Props {
  state: GameState;
}

const COLORS = ['#3b82f6', '#ef4444'];
const HP_COLORS = ['#22c55e', '#eab308', '#ef4444'];

function getHpColor(ratio: number): string {
  if (ratio > 0.5) return HP_COLORS[0];
  if (ratio > 0.25) return HP_COLORS[1];
  return HP_COLORS[2];
}

export function FightingGame({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const f = state.fighters;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
    }

    // Health bars (top)
    const barWidth = 300;
    const barHeight = 20;
    const barY = 20;
    const barGap = 40;

    // P1 health (left)
    const p1Ratio = Math.max(0, f[0].hp / f[0].maxHp);
    ctx.fillStyle = '#333';
    ctx.fillRect(barGap, barY, barWidth, barHeight);
    ctx.fillStyle = getHpColor(p1Ratio);
    ctx.fillRect(barGap, barY, barWidth * p1Ratio, barHeight);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(barGap, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${f[0].hp}`, barGap + 8, barY + 15);

    // P2 health (right)
    const p2Ratio = Math.max(0, f[1].hp / f[1].maxHp);
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
    ctx.fillText(`${f[1].hp}`, p2BarX + barWidth - 8, barY + 15);

    // Names
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS[0];
    ctx.fillText('P1', barGap, barY - 6);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS[1];
    ctx.fillText('P2', CANVAS_WIDTH - barGap, barY - 6);

    // Round scores
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`[ ${state.scores[0]} - ${state.scores[1]} ]`, CANVAS_WIDTH / 2, barY - 6);

    // Timer (center between health bars)
    const timerSec = Math.ceil(state.timer / 20);
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = timerSec <= 10 ? '#ef4444' : '#fff';
    ctx.fillText(String(timerSec), CANVAS_WIDTH / 2, barY + barHeight + 25);

    // Round indicator
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`Round ${state.round}`, CANVAS_WIDTH / 2, barY + barHeight + 45);

    // Draw fighters
    for (let i = 0; i < 2; i++) {
      const fighter = f[i];
      const color = COLORS[i];
      const x = fighter.x - FIGHTER_WIDTH / 2;
      const y = fighter.y - FIGHTER_HEIGHT;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(fighter.x, GROUND_Y + 2, FIGHTER_WIDTH / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);

      // Head
      ctx.beginPath();
      ctx.arc(fighter.x, y - 5, 12, 0, Math.PI * 2);
      ctx.fill();

      // Direction indicator (small triangle)
      ctx.fillStyle = '#fff';
      const dirX = fighter.facingRight ? fighter.x + 14 : fighter.x - 14;
      ctx.beginPath();
      ctx.moveTo(dirX, y + FIGHTER_HEIGHT / 2);
      ctx.lineTo(fighter.facingRight ? dirX - 8 : dirX + 8, y + FIGHTER_HEIGHT / 2 - 6);
      ctx.lineTo(fighter.facingRight ? dirX - 8 : dirX + 8, y + FIGHTER_HEIGHT / 2 + 6);
      ctx.closePath();
      ctx.fill();

      // Attack visual
      if (fighter.status === 'punch') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        const punchX = fighter.facingRight ? fighter.x + FIGHTER_WIDTH / 2 : fighter.x - FIGHTER_WIDTH / 2;
        ctx.beginPath();
        ctx.moveTo(punchX, y + FIGHTER_HEIGHT * 0.3);
        ctx.lineTo(fighter.facingRight ? punchX + 25 : punchX - 25, y + FIGHTER_HEIGHT * 0.3);
        ctx.stroke();
      }

      if (fighter.status === 'kick') {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        const kickX = fighter.facingRight ? fighter.x + FIGHTER_WIDTH / 2 : fighter.x - FIGHTER_WIDTH / 2;
        ctx.beginPath();
        ctx.moveTo(kickX, y + FIGHTER_HEIGHT * 0.7);
        ctx.lineTo(fighter.facingRight ? kickX + 35 : kickX - 35, y + FIGHTER_HEIGHT * 0.7);
        ctx.stroke();
      }

      // Hit flash
      if (fighter.status === 'hit') {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x, y, FIGHTER_WIDTH, FIGHTER_HEIGHT);
      }

      // Block visual
      if (fighter.status === 'block') {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fighter.x, y + FIGHTER_HEIGHT / 2, FIGHTER_WIDTH * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [state]);

  const countdownValue = state.status === 'countdown'
    ? Math.ceil(state.countdown / 20)
    : null;

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {countdownValue !== null && countdownValue > 0 && (
        <div className={styles.overlay}>
          <span className={styles.countdownText}>
            {countdownValue > 3 ? t('games.fight') : countdownValue}
          </span>
        </div>
      )}
      {state.status === 'round_end' && (
        <div className={styles.overlay}>
          <span className={styles.roundEndText}>
            {state.roundWinner !== null
              ? `${t('games.player')} ${state.roundWinner + 1} ${t('games.wins_round')}`
              : t('games.draw')}
          </span>
        </div>
      )}
      {state.status === 'match_end' && (
        <div className={styles.overlay}>
          <span className={styles.matchEndText}>
            🏆 {`${t('games.player')} ${state.matchWinner! + 1} ${t('games.wins_match')}`}
          </span>
        </div>
      )}
    </div>
  );
}
