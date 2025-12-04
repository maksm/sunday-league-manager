'use client';

import { useState, useEffect } from 'react';
import { t } from '@/i18n/client';
import styles from './UserMenu.module.css';

type Team = {
  id: string;
  name: string;
  badge: string | null;
};

interface ChangeTeamModalProps {
  onClose: () => void;
  currentTeamId?: string | null;
}

export default function ChangeTeamModal({ onClose, currentTeamId }: ChangeTeamModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/player/change-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || t('dashboard.changeTeamDialog.error'));
      }
    } catch {
      setError(t('dashboard.changeTeamDialog.error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.dialogOverlay} onClick={onClose}>
        <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.dialogHeader}>
            <h2 className={styles.dialogTitle}>{t('dashboard.changeTeamDialog.successTitle')}</h2>
          </div>
          <div className={styles.successMessage}>
            {t('dashboard.changeTeamDialog.successMessage')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>{t('dashboard.changeTeamDialog.title')}</h2>
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

        <form onSubmit={handleSubmit} className={styles.dialogForm}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('dashboard.changeTeamDialog.label')}</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className={styles.input}
              disabled={loading}
            >
              <option value="">💰 {t('dashboard.changeTeamDialog.freeAgent')}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.badge} {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dialogActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              {t('dashboard.changeTeamDialog.cancel')}
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading
                ? t('dashboard.changeTeamDialog.submitting')
                : t('dashboard.changeTeamDialog.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
