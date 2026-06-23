import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './CheckersGame.module.css';

interface Move {
  from: [number, number];
  to: [number, number];
}

interface GameState {
  board: number[][];
  currentPlayer: number;
  winner: number | null;
  moveCount: number;
  lastMove: Move | null;
  captured: [number, number][];
  mustContinue: [number, number] | null;
}

interface Props {
  state: GameState;
  playerIndex: number;
  onMove: (from: [number, number], to: [number, number]) => void;
  onRematch: () => void;
  onLeave: () => void;
}

const EMPTY = 0;
const WHITE = 1;
const BLACK = 2;
const WHITE_KING = 3;
const BLACK_KING = 4;

function getJumps(board: number[][], r: number, c: number): { to: [number, number] }[] {
  const p = board[r]![c]!;
  if (!p) return [];
  const isWhite = p === WHITE || p === WHITE_KING;
  const isKing = p === WHITE_KING || p === BLACK_KING;
  const dirs: [number, number][] = [];
  if (isWhite || isKing) dirs.push([-1, -1], [-1, 1]);
  if (!isWhite || isKing) dirs.push([1, -1], [1, 1]);
  const jumps: { to: [number, number] }[] = [];
  for (const [dr, dc] of dirs) {
    const isOwn = (cell: number) =>
      (isWhite && (cell === WHITE || cell === WHITE_KING)) ||
      (!isWhite && (cell === BLACK || cell === BLACK_KING));
    let captured: [number, number] | null = null;
    const limit = isKing ? 7 : 2;
    for (let i = 1; i <= limit; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
      const cell = board[nr]![nc]!;
      if (captured) {
        if (cell !== EMPTY) break;
        jumps.push({ to: [nr, nc] });
        if (!isKing) break;
      } else {
        if (cell === EMPTY) {
          if (!isKing) break;
          continue;
        }
        if (isOwn(cell)) break;
        captured = [nr, nc];
      }
    }
  }
  return jumps;
}

function getSimpleMoves(board: number[][], r: number, c: number): [number, number][] {
  const p = board[r]![c]!;
  if (!p) return [];
  const isWhite = p === WHITE || p === WHITE_KING;
  const isKing = p === WHITE_KING || p === BLACK_KING;
  const dirs: [number, number][] = [];
  if (isWhite || isKing) dirs.push([-1, -1], [-1, 1]);
  if (!isWhite || isKing) dirs.push([1, -1], [1, 1]);
  const moves: [number, number][] = [];
  for (const [dr, dc] of dirs) {
    const limit = isKing ? 7 : 1;
    for (let i = 1; i <= limit; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
      if (board[nr]![nc] !== EMPTY) break;
      moves.push([nr, nc]);
    }
  }
  return moves;
}

function hasAnyJumps(board: number[][], player: number): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r]![c]!;
      if (p === EMPTY) continue;
      const isWhite = p === WHITE || p === WHITE_KING;
      if ((player === 0 && !isWhite) || (player === 1 && isWhite)) continue;
      if (getJumps(board, r, c).length > 0) return true;
    }
  }
  return false;
}

function isOwnPiece(piece: number, playerIndex: number): boolean {
  if (piece === EMPTY) return false;
  const isWhite = piece === WHITE || piece === WHITE_KING;
  return (playerIndex === 0 && isWhite) || (playerIndex === 1 && !isWhite);
}

function getCaptureMoves(board: number[][], r: number, c: number): [number, number][] {
  return getJumps(board, r, c).map((j) => j.to);
}

export function CheckersGame({ state, playerIndex, onMove, onRematch, onLeave }: Props) {
  const { t } = useTranslation('common');
  const { board, currentPlayer, winner, lastMove, mustContinue } = state;
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const flipped = playerIndex === 1;
  const isMyTurn = currentPlayer === playerIndex && winner === null;
  const isFinished = winner !== null;

  const toServer = (r: number, c: number): [number, number] =>
    flipped ? [7 - r, 7 - c] : [r, c];

  const canSelect = (r: number, c: number): boolean => {
    if (!isMyTurn) return false;
    if (isFinished) return false;
    const [sr, sc] = toServer(r, c);
    const p = board[sr]![sc]!;
    if (!isOwnPiece(p, playerIndex)) return false;
    if (mustContinue) {
      return mustContinue[0] === sr && mustContinue[1] === sc;
    }
    return true;
  };

  const getValidTargets = (r: number, c: number): [number, number][] => {
    const [sr, sc] = toServer(r, c);
    const p = board[sr]![sc]!;
    if (!isOwnPiece(p, playerIndex)) return [];
    const jumps = getCaptureMoves(board, sr, sc);
    if (jumps.length > 0) return jumps;
    if (mustContinue) return [];
    if (hasAnyJumps(board, currentPlayer)) return [];
    return getSimpleMoves(board, sr, sc);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn || isFinished) return;

    if (selected) {
      const selectedServer = toServer(selected[0], selected[1]);
      const targets = getValidTargets(selected[0], selected[1]);
      const clickServer = toServer(r, c);
      if (targets.some(([tr, tc]) => tr === clickServer[0] && tc === clickServer[1])) {
        onMove(selectedServer, clickServer);
        setSelected(null);
        return;
      }
    }

    if (canSelect(r, c)) {
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  };

  const renderPiece = (r: number, c: number) => {
    const [sr, sc] = toServer(r, c);
    const p = board[sr]![sc]!;
    if (p === EMPTY) return null;
    const isWhite = p === WHITE || p === WHITE_KING;
    const isKing = p === WHITE_KING || p === BLACK_KING;
    const isSelected = selected && selected[0] === r && selected[1] === c;

    let cls = `${styles.piece} ${isWhite ? styles.pieceWhite : styles.pieceBlack}`;
    if (isSelected) cls += ` ${styles.pieceSelected}`;

    return (
      <div className={cls}>
        {isKing && <span className={styles.kingMark}>♛</span>}
      </div>
    );
  };

  const renderValidMark = (r: number, c: number) => {
    if (!selected) return null;
    const targets = getValidTargets(selected[0], selected[1]);
    const [sr, sc] = toServer(r, c);
    const isTarget = targets.some(([tr, tc]) => tr === sr && tc === sc);
    if (!isTarget) return null;

    const [selSr, selSc] = toServer(selected[0], selected[1]);
    const jumps = getCaptureMoves(board, selSr, selSc);
    const isCapture = jumps.some(([tr, tc]) => tr === sr && tc === sc);

    return <div className={isCapture ? styles.captureDot : styles.validDot} />;
  };

  const playerColorName = playerIndex === 0 ? t('games.white') : t('games.black');

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.colorIndicator}>
          {t('games.you_play_as')} {playerColorName}
        </span>
        <span className={styles.turnInfo}>
          {isFinished ? (
            winner === playerIndex ? t('games.you_win') : t('games.you_lose')
          ) : (
            isMyTurn ? t('games.your_turn') : t('games.opponent_turn')
          )}
          {mustContinue && (
            <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
              ({t('games.must_capture')})
            </span>
          )}
        </span>
      </div>

      <div className={styles.board}>
        {Array.from({ length: 8 }, (_, rd) => rd).map((rd) => {
          const r = flipped ? 7 - rd : rd;
          return Array.from({ length: 8 }, (_, cd) => {
            const c = flipped ? 7 - cd : cd;
            const isDark = (r + c) % 2 !== 0;
            const isLast = lastMove && (
              (lastMove.from[0] === r && lastMove.from[1] === c) ||
              (lastMove.to[0] === r && lastMove.to[1] === c)
            );

            let cellCls = `${styles.cell} ${isDark ? styles.cellDark : styles.cellLight}`;
            if (isLast) cellCls += ` ${styles.lastMove}`;

            return (
              <div
                key={`${rd}-${cd}`}
                className={cellCls}
                onClick={() => handleCellClick(rd, cd)}
              >
                {renderPiece(rd, cd)}
                {renderValidMark(rd, cd)}
              </div>
            );
          });
        })}
      </div>

      {isFinished && (
        <div className={styles.resultOverlay}>
          <span className={styles.resultText}>
            {winner === playerIndex ? t('games.you_win') : t('games.you_lose')}
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
