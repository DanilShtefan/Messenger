import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Grid3X3, Shapes, Sword } from 'lucide-react';
import styles from './GamesPage.module.css';

const games = [
  {
    id: 'fighting',
    icon: Sword,
    title: 'games.fighting',
    description: 'games.fighting_desc',
    color: '#ef4444',
  },
  {
    id: 'tic-tac-toe',
    icon: Grid3X3,
    title: 'games.tic_tac_toe',
    description: 'games.tic_tac_toe_desc',
    color: '#6366f1',
  },
  {
    id: 'snake',
    icon: Gamepad2,
    title: 'games.snake',
    description: 'games.snake_desc',
    color: '#22c55e',
  },
  {
    id: 'memory',
    icon: Shapes,
    title: 'games.memory',
    description: 'games.memory_desc',
    color: '#f59e0b',
  },
];

export function GamesPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Gamepad2 size={28} className={styles.headerIcon} />
        <h2 className={styles.heading}>{t('games.title')}</h2>
      </div>
      <p className={styles.subtitle}>{t('games.subtitle')}</p>

      <div className={styles.grid}>
        {games.map((game) => (
          <button
            key={game.id}
            className={styles.card}
            style={{ '--card-accent': game.color } as React.CSSProperties}
            onClick={() => navigate(`/games/${game.id}`)}
          >
            <div className={styles.cardIcon}>
              <game.icon size={40} />
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.cardTitle}>{t(game.title)}</span>
              <span className={styles.cardDesc}>{t(game.description)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
