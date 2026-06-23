import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { useLogin } from '@/shared/hooks/useLogin';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { login, isLoading, error } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = t('validation.required', { field: t('auth.login.email') });
    if (!password) errors.password = t('validation.required', { field: t('auth.login.password') });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ email: email.trim(), password });
      navigate('/chats', { replace: true });
    } catch {
      // error is set in hook
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('auth.login.title_short')}</h1>
        <p className={styles.subtitle}>{t('auth.login.welcome_back')}</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label={t('auth.login.email')}
            type="email"
            placeholder={t('auth.login.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <Input
            label={t('auth.login.password')}
            type="password"
            placeholder={t('auth.login.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
          />

          {error && <div className={styles.apiError}>{error}</div>}

          <Button type="submit" fullWidth isLoading={isLoading}>
            {t('auth.login.title_short')}
          </Button>
        </form>

        <p className={styles.footer}>
          {t('auth.login.no_account')} <Link to="/register">{t('auth.login.sign_up')}</Link>
        </p>
      </div>
    </div>
  );
}
