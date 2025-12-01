'use client';

import { useState } from 'react';
import styles from './UserMenu.module.css';
import { useTranslations } from '@/i18n/client';

interface ResetPasswordDialogProps {
  onClose: () => void;
}

export default function ResetPasswordDialog({ onClose }: ResetPasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const dict = useTranslations();
  const dialog = dict.dashboard.resetPasswordDialog as Record<string, unknown>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(
        ((dialog.errors as Record<string, string>)?.passwordMismatch ||
          'New passwords do not match') as string
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        ((dialog.errors as Record<string, string>)?.passwordTooShort ||
          'Password must be at least 6 characters') as string
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setError(
        ((dialog.errors as Record<string, string>)?.genericError ||
          'An error occurred. Please try again.') as string
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>{(dialog.title as string) || 'Reset Password'}</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            {(dialog.success as string) || 'Password reset successfully!'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.dialogForm}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword" className={styles.label}>
                {
                  ((dialog.form as Record<string, string>)?.currentPassword ||
                    'Current Password') as string
                }
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                {((dialog.form as Record<string, string>)?.newPassword || 'New Password') as string}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                {
                  ((dialog.form as Record<string, string>)?.confirmPassword ||
                    'Confirm New Password') as string
                }
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.dialogActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isLoading}
              >
                {((dialog.form as Record<string, string>)?.cancel || 'Cancel') as string}
              </button>
              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading
                  ? (((dialog.form as Record<string, string>)?.submitting ||
                      'Resetting...') as string)
                  : (((dialog.form as Record<string, string>)?.submit ||
                      'Reset Password') as string)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
