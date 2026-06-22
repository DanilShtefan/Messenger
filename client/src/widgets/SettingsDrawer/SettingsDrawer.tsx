import { X, Check } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';
import styles from './SettingsDrawer.module.css';

const BACKGROUND_PRESETS = [
  { id: 'none', label: 'None' },
  { id: 'nature', label: 'Nature' },
  { id: 'city', label: 'City' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'cosmos', label: 'Cosmos' },
  { id: 'ocean', label: 'Ocean' },
];

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { theme, toggleTheme, background, setBackground } = useTheme();

  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close settings">
            <X size={20} />
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Appearance</span>
            <div className={styles.row}>
              <span className={styles.label}>Dark theme</span>
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
            <span className={styles.sectionTitle}>Background</span>
            <div className={styles.grid}>
              {BACKGROUND_PRESETS.map((bg) => {
                const thumb = bg.id === 'none' ? null : `/backgrounds/thumbs/dark/${bg.id}.jpg`;
                return (
                  <button
                    key={bg.id}
                    className={`${styles.card} ${background === bg.id ? styles.cardActive : ''}`}
                    onClick={() => setBackground(bg.id)}
                    type="button"
                    title={bg.label}
                  >
                    {thumb ? (
                      <img src={thumb} alt={bg.label} className={styles.cardPreview} loading="lazy" decoding="async" />
                    ) : (
                      <div className={styles.cardPreview + ' ' + styles.cardNone}>None</div>
                    )}
                    <span className={styles.cardLabel}>
                      {background === bg.id && <Check size={10} style={{ marginRight: 2 }} />}
                      {bg.label}
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
