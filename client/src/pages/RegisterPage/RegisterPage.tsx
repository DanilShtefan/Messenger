import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/shared/ui';
import { useRegister } from '@/shared/hooks/useRegister';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { register, isLoading, error } = useRegister();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = t('validation.required', { field: t('auth.register.email') });
    if (!password) errors.password = t('validation.required', { field: t('auth.register.password') });
    else if (password.length < 6) errors.password = t('validation.min_length', { count: 6 });
    if (!displayName.trim()) errors.displayName = t('validation.display_name_required');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({ email: email.trim(), password, displayName: displayName.trim() });
      navigate('/chats', { replace: true });
    } catch {
      // error is set in hook
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('auth.register.title_short')}</h1>
        <p className={styles.subtitle}>{t('auth.register.subtitle')}</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label={t('auth.register.name')}
            placeholder={t('auth.register.name_placeholder')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={fieldErrors.displayName}
          />

          <Input
            label={t('auth.register.email')}
            type="email"
            placeholder={t('auth.register.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <Input
            label={t('auth.register.password')}
            type="password"
            placeholder={t('auth.register.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="new-password"
          />

          {error && <div className={styles.apiError}>{error}</div>}

          <Button type="submit" fullWidth isLoading={isLoading}>
            {t('auth.register.button')}
          </Button>
        </form>

        <p className={styles.footer}>
          {t('auth.register.have_account')} <Link to="/login">{t('auth.login.title_short')}</Link>
        </p>
      </div>
    </div>
  );
}
