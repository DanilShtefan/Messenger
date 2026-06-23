import { useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useCheckersGame } from '@/shared/hooks/useCheckersGame';
import styles from './CheckersPage.module.css';

const CheckersGame = lazy(() =>
  import('@/widgets/CheckersGame/CheckersGame').then((m) => ({ default: m.CheckersGame })),
);

export function CheckersPage() {
  const { t } = useTranslation('common');
  const { state, createRoom, joinRoom, toggleReady, makeMove, rematch, leave } = useCheckersGame();
  const [joinCode, setJoinCode] = useState('');

  if (state.screen === 'menu') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>{t('games.checkers')}</h2>
          <p className={styles.subtitle}>{t('games.checkers_desc')}</p>

          <div className={styles.actions}>
            <div className={styles.colorPicker}>
              <span className={styles.colorLabel}>{t('games.play_as')}</span>
              <div className={styles.colorOptions}>
                <button className={styles.colorBtn} onClick={() => createRoom(0)}>
                  <span className={`${styles.pieceIcon} ${styles.pieceWhiteIcon}`} />
                  {t('games.white')}
                </button>
                <button className={styles.colorBtn} onClick={() => createRoom(1)}>
                  <span className={`${styles.pieceIcon} ${styles.pieceBlackIcon}`} />
                  {t('games.black')}
                </button>
              </div>
            </div>

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
              <CheckersGame
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
