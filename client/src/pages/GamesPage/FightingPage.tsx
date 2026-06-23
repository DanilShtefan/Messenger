import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFightingGame } from '@/shared/hooks/useFightingGame';
import { FightingGame } from '@/widgets/FightingGame/FightingGame';
import styles from './FightingPage.module.css';

const BEST_OF_OPTIONS = [1, 3, 5] as const;

export function FightingPage() {
  const { t } = useTranslation('common');
  const { state, createRoom, joinRoom, toggleReady, rematch, leave } = useFightingGame();
  const [bestOf, setBestOf] = useState<number>(3);
  const [joinCode, setJoinCode] = useState('');

  if (state.screen === 'menu') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 className={styles.title}>{t('games.fighting')}</h2>
          <p className={styles.subtitle}>{t('games.fighting_desc')}</p>

          <div className={styles.bestOf}>
            {BEST_OF_OPTIONS.map((n) => (
              <button
                key={n}
                className={`${styles.bestOfBtn} ${bestOf === n ? styles.bestOfBtnActive : ''}`}
                onClick={() => setBestOf(n)}
              >
                bo{n}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button className={styles.createBtn} onClick={() => createRoom(bestOf)}>
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

          <div className={styles.controlsHint}>
            <div className={styles.controlsColumn}>
              <span className={styles.controlsTitle}>P1</span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>A</span><span className={styles.key}>D</span>
                <span className={styles.action}>{t('games.move')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>W</span>
                <span className={styles.action}>{t('games.jump')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>S</span>
                <span className={styles.action}>{t('games.block')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>F</span>
                <span className={styles.action}>{t('games.punch')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>G</span>
                <span className={styles.action}>{t('games.kick')}</span>
              </span>
            </div>
            <div className={styles.controlsColumn}>
              <span className={styles.controlsTitle}>P2</span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>←</span><span className={styles.key}>→</span>
                <span className={styles.action}>{t('games.move')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>↑</span>
                <span className={styles.action}>{t('games.jump')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>↓</span>
                <span className={styles.action}>{t('games.block')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>J</span>
                <span className={styles.action}>{t('games.punch')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>K</span>
                <span className={styles.action}>{t('games.kick')}</span>
              </span>
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

          <div className={styles.controlsHint}>
            <div className={styles.controlsColumn}>
              <span className={styles.controlsTitle}>P1</span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>A</span><span className={styles.key}>D</span>
                <span className={styles.action}>{t('games.move')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>W</span>
                <span className={styles.action}>{t('games.jump')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>S</span>
                <span className={styles.action}>{t('games.block')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>F</span>
                <span className={styles.action}>{t('games.punch')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>G</span>
                <span className={styles.action}>{t('games.kick')}</span>
              </span>
            </div>
            <div className={styles.controlsColumn}>
              <span className={styles.controlsTitle}>P2</span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>←</span><span className={styles.key}>→</span>
                <span className={styles.action}>{t('games.move')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>↑</span>
                <span className={styles.action}>{t('games.jump')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>↓</span>
                <span className={styles.action}>{t('games.block')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>J</span>
                <span className={styles.action}>{t('games.punch')}</span>
              </span>
              <span className={styles.controlsRow}>
                <span className={styles.key}>K</span>
                <span className={styles.action}>{t('games.kick')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'match_end' || state.screen === 'round_end') {
    return (
      <div className={styles.page}>
        <div className={styles.gameArea}>
          {state.gameState && <FightingGame state={state.gameState} />}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={styles.resultActions}>
              {state.screen === 'match_end' && (
                <>
                  <button className={styles.rematchBtn} onClick={rematch}>
                    {t('games.rematch')}
                  </button>
                  <button className={styles.leaveBtn} onClick={leave}>
                    {t('games.leave')}
                  </button>
                </>
              )}
              {state.screen === 'round_end' && state.gameState?.status === 'round_end' && (
                <p style={{ color: '#888' }}>
                  {t('games.next_round_soon')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.gameArea}>
        {state.gameState && <FightingGame state={state.gameState} />}
      </div>
    </div>
  );
}
