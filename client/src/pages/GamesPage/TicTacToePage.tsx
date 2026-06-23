import { useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTicTacToeGame } from '@/shared/hooks/useTicTacToeGame';
import styles from './TicTacToePage.module.css';

const TicTacToeGame = lazy(() =>
  import('@/widgets/TicTacToeGame/TicTacToeGame').then((m) => ({ default: m.TicTacToeGame })),
);

export function TicTacToePage() {
  const { t } = useTranslation('common');
  const { state, createRoom, joinRoom, toggleReady, makeMove, rematch, leave } = useTicTacToeGame();
  const [joinCode, setJoinCode] = useState('');

  if (state.screen === 'menu') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>{t('games.tic_tac_toe')}</h2>
          <p className={styles.subtitle}>{t('games.tic_tac_toe_desc')}</p>

          <div className={styles.actions}>
            <button className={styles.createBtn} onClick={() => createRoom()}>
              {t('games.create_room')}
            </button>

            <div className={styles.divider}>{t('games.or')}</div>

            <div className={styles.joinRow}>
              <input
                className={styles.codeInput}
                placeholder={t('games.room_code')}
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button
                className={styles.joinBtn}
                disabled={joinCode.length !== 4}
                onClick={() => joinRoom(joinCode)}
              >
                {t('games.join')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'lobby') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.roomCodeLabel}>{t('games.room_code')}</p>
          <h2 className={styles.roomCode}>{state.room?.code ?? '----'}</h2>

          <div className={styles.players}>
            <div className={styles.playerSlot}>
              <span className={styles.playerName}>
                {state.room?.player1.name ?? t('games.player') + ' 1'}
              </span>
              <span className={`${styles.playerBadge} ${state.room?.player1.ready ? styles.readyBadge : styles.waitBadge}`}>
                {state.room?.player1.ready ? t('games.ready') : t('games.waiting')}
              </span>
            </div>
            <span className={styles.vs}>VS</span>
            <div className={styles.playerSlot}>
              <span className={styles.playerName}>
                {state.room?.player2?.name ?? '...'}
              </span>
              {state.room?.player2 ? (
                <span className={`${styles.playerBadge} ${state.room?.player2.ready ? styles.readyBadge : styles.waitBadge}`}>
                  {state.room?.player2.ready ? t('games.ready') : t('games.waiting')}
                </span>
              ) : (
                <span className={`${styles.playerBadge} ${styles.waitBadge}`}>
                  {t('games.not_joined')}
                </span>
              )}
            </div>
          </div>

          <button
            className={`${styles.readyBtn} ${state.room?.player1.ready === true && state.playerIndex === 0 ? styles.readyBtnActive : ''} ${state.room?.player2?.ready === true && state.playerIndex === 1 ? styles.readyBtnActive : ''}`}
            onClick={toggleReady}
          >
            {((state.playerIndex === 0 && state.room?.player1.ready) ||
              (state.playerIndex === 1 && state.room?.player2?.ready))
              ? t('games.not_ready')
              : t('games.ready_btn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.gameArea}>
        <div className={styles.gameWrapper}>
          {state.gameState && (
            <Suspense fallback={<div>{t('games.loading')}...</div>}>
              <TicTacToeGame
                state={state.gameState}
                playerIndex={state.playerIndex}
                onMove={makeMove}
                onRematch={rematch}
                onLeave={leave}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
