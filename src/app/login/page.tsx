'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { useTranslations } from '@/i18n/client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dict = useTranslations();
  const login = dict.auth.login as Record<string, unknown>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        ((login.errors as Record<string, string>)?.invalidCredentials ||
          'Invalid credentials') as string
      );
    } else {
      // Add small delay to ensure session is established
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{(login.title as string) || 'Welcome Back'}</h1>
          <p className={styles.subtitle}>
            {(login.subtitle as string) || 'Sign in to your Sunday League account'}
          </p>
        </div>

        {error && (
          <div className={styles.alert}>
            <p className={styles.alertText}>
              <span className={styles.alertStrong}>
                {(dict.common.status as Record<string, string>).error || 'Error'}!
              </span>{' '}
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              {((login.form as Record<string, string>)?.username || 'Username') as string}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                ((login.form as Record<string, string>)?.usernamePlaceholder ||
                  'Enter your username') as string
              }
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              {((login.form as Record<string, string>)?.password || 'Password') as string}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                ((login.form as Record<string, string>)?.passwordPlaceholder ||
                  'Enter your password') as string
              }
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <span className={styles.buttonContent}>
                <svg className={styles.spinner} viewBox="0 0 24 24">
                  <circle
                    className={styles.spinnerCircle}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className={styles.spinnerPath}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {((login.form as Record<string, string>)?.submitting || 'Signing in...') as string}
              </span>
            ) : (
              (((login.form as Record<string, string>)?.submit || 'Sign In') as string)
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            {
              ((login.footer as Record<string, string>)?.noAccount ||
                "Don't have an account?") as string
            }{' '}
            <Link href="/register" className={styles.link}>
              {
                ((login.footer as Record<string, string>)?.registerLink ||
                  'Register here') as string
              }
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
