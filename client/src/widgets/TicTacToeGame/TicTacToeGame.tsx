import { useTranslation } from 'react-i18next';
import styles from './TicTacToeGame.module.css';

interface GameState {
  board: (null | 'X' | 'O')[][];
  currentPlayer: 0 | 1;
  winner: number | null;
  draw: boolean;
  moveCount: number;
  lastMove: { row: number; col: number } | null;
}

interface Props {
  state: GameState;
  playerIndex: number;
  onMove: (row: number, col: number) => void;
  onRematch: () => void;
  onLeave: () => void;
}

const WINNING_LINES: [number, number][][] = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

function getWinCells(board: (null | 'X' | 'O')[][]): Set<string> | null {
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
      return new Set(line.map(([r, c]) => `${r},${c}`));
    }
  }
  return null;
}

export function TicTacToeGame({ state, playerIndex, onMove, onRematch, onLeave }: Props) {
  const { t } = useTranslation('common');
  const { board, currentPlayer, winner, draw, lastMove } = state;
  const isMyTurn = currentPlayer === playerIndex && winner === null && !draw;
  const winCells = getWinCells(board);
  const isFinished = winner !== null || draw;

  return (
    <div className={styles.wrapper}>
      <div className={styles.turnInfo}>
        {isFinished ? (
          winner !== null
            ? (winner === playerIndex ? t('games.you_win') : t('games.you_lose'))
            : t('games.draw')
        ) : (
          <>
            {isMyTurn ? t('games.your_turn') : t('games.opponent_turn')}
            {' — '}
            <span className={currentPlayer === 0 ? styles.turnX : styles.turnO}>
              {currentPlayer === 0 ? 'X' : 'O'}
            </span>
          </>
        )}
      </div>

      <div className={styles.board}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isLast = lastMove?.row === r && lastMove?.col === c;
            const isWin = winCells?.has(`${r},${c}`);
            const canClick = isMyTurn && cell === null;

            let className = styles.cell;
            if (!canClick || isFinished) className += ` ${styles.disabled}`;
            if (cell === 'X') className += ` ${styles.cellX}`;
            if (cell === 'O') className += ` ${styles.cellO}`;
            if (isWin) className += ` ${styles.winCell}`;
            if (isLast) className += ` ${styles.lastMove}`;

            return (
              <button
                key={`${r}-${c}`}
                className={className}
                onClick={() => canClick && onMove(r, c)}
                disabled={!canClick}
              >
                {cell === 'X' && (
                  <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="4" y1="4" x2="20" y2="20" />
                    <line x1="20" y1="4" x2="4" y2="20" />
                  </svg>
                )}
                {cell === 'O' && (
                  <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>

      {isFinished && (
        <div className={styles.resultOverlay}>
          <span className={styles.resultText}>
            {winner !== null
              ? (winner === playerIndex ? t('games.you_win') : t('games.you_lose'))
              : t('games.draw')}
          </span>
          <div className={styles.resultActions}>
            <button className={styles.rematchBtn} onClick={onRematch}>
              {t('games.rematch')}
            </button>
            <button className={styles.leaveBtn} onClick={onLeave}>
              {t('games.leave')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
