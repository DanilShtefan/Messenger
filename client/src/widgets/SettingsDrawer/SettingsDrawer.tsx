import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/app/providers/ThemeProvider';
import styles from './SettingsDrawer.module.css';

const BACKGROUND_PRESETS = ['none', 'nature', 'city', 'abstract', 'cosmos', 'ocean'];

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { t } = useTranslation('common');
  const { theme, toggleTheme, background, setBackground } = useTheme();

  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('settings.title')}</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close settings">
            <X size={20} />
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>{t('settings.appearance')}</span>
            <div className={styles.row}>
              <span className={styles.label}>{t('settings.dark_theme')}</span>
              <button
                className={styles.toggle}
                data-active={theme === 'dark'}
                onClick={toggleTheme}
                type="button"
                aria-label="Toggle theme"
              >
                <div className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>{t('settings.background')}</span>
            <div className={styles.grid}>
              {BACKGROUND_PRESETS.map((bgId) => {
                const thumb = bgId === 'none' ? null : `/backgrounds/thumbs/dark/${bgId}.jpg`;
                const label = t('settings.backgrounds.' + bgId);
                return (
                  <button
                    key={bgId}
                    className={`${styles.card} ${background === bgId ? styles.cardActive : ''}`}
                    onClick={() => setBackground(bgId)}
                    type="button"
                    title={label}
                  >
                    {thumb ? (
                      <img src={thumb} alt={label} className={styles.cardPreview} loading="lazy" decoding="async" />
                    ) : (
                      <div className={styles.cardPreview + ' ' + styles.cardNone}>{t('settings.backgrounds.none')}</div>
                    )}
                    <span className={styles.cardLabel}>
                      {background === bgId && <Check size={10} style={{ marginRight: 2 }} />}
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
