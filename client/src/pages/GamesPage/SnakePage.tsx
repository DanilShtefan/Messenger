import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SnakePage.module.css';

const SnakeGame = lazy(() =>
  import('@/widgets/SnakeGame/SnakeGame').then((m) => ({ default: m.SnakeGame })),
);

export function SnakePage() {
  const { t } = useTranslation('common');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Suspense fallback={<div className={styles.loading}>{t('games.loading')}...</div>}>
          <SnakeGame />
        </Suspense>
      </div>
    </div>
  );
}
