import { User, Music, Film, Gamepad2, Settings, Globe, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useLogout } from '@/shared/hooks/useLogout';
import styles from './MobileMoreSheet.module.css';

interface MobileMoreSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function MobileMoreSheet({ open, onClose, onOpenSettings }: MobileMoreSheetProps) {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.user.currentUser);
  const logout = useLogout();

  if (!open) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    onClose();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.title}>{t('settings.title')}</div>

        {user && (
          <button className={styles.item} onClick={() => handleNav(`/profile/${user.id}`)}>
            <User size={20} className={styles.itemIcon} />
            <span className={styles.itemLabel}>{user.displayName}</span>
          </button>
        )}

        <div className={styles.divider} />

        <button className={styles.item} onClick={() => handleNav('/music')}>
          <Music size={20} className={styles.itemIcon} />
          <span className={styles.itemLabel}>{t('navigation.music')}</span>
        </button>

        <button className={styles.item} onClick={() => handleNav('/movies')}>
          <Film size={20} className={styles.itemIcon} />
          <span className={styles.itemLabel}>{t('navigation.movies')}</span>
        </button>

        <button className={styles.item} onClick={() => handleNav('/games')}>
          <Gamepad2 size={20} className={styles.itemIcon} />
          <span className={styles.itemLabel}>{t('navigation.games')}</span>
        </button>

        <div className={styles.divider} />

        <button className={styles.item} onClick={() => { onOpenSettings(); onClose(); }}>
          <Settings size={20} className={styles.itemIcon} />
          <span className={styles.itemLabel}>{t('settings.title')}</span>
        </button>

        <button className={styles.item} onClick={toggleLanguage}>
          <Globe size={20} className={styles.itemIcon} />
          <span className={styles.itemLabel}>{t('settings.language')}</span>
          <span className={styles.langIndicator}>
            {i18n.language === 'en' ? 'EN' : 'RU'}
          </span>
        </button>

        <div className={styles.divider} />

        <button className={styles.item} onClick={() => logout().then(() => { navigate('/login'); onClose(); })}>
          <LogOut size={20} className={styles.itemIcon} />
          <span className={styles.itemLabel}>{t('button.logout')}</span>
        </button>
      </div>
    </>
  );
}
