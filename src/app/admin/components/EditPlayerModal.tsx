'use client';

import { useState, useEffect } from 'react';
import styles from './Modal.module.css';
import { useTranslations } from '@/i18n/client';

type Team = {
  id: string;
  name: string;
  badge: string | null;
};

type Player = {
  id: string;
  name: string;
  isActive: boolean;
  teamId?: string | null;
  user: { username: string } | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    username?: string;
    password?: string;
    isActive: boolean;
    teamId?: string | null;
  }) => Promise<void>;
  player: Player;
};

export default function EditPlayerModal({ isOpen, onClose, onSave, player }: Props) {
  const [name, setName] = useState(player.name);
  const [username, setUsername] = useState(player.user?.username || '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(player.isActive);
  const [teamId, setTeamId] = useState<string>(player.teamId || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dict = useTranslations();
  const common = dict.common as Record<string, string>;

  useEffect(() => {
    if (isOpen) {
      setName(player.name);
      setUsername(player.user?.username || '');
      setPassword('');
      setIsActive(player.isActive);
      setTeamId(player.teamId || '');
      setError('');

      // Fetch teams
      fetch('/api/teams')
        .then((res) => res.json())
        .then((data) => setTeams(data))
        .catch(console.error);
    }
  }, [isOpen, player]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSave({
        name,
        ...(player.user && { username }),
        ...(password && { password }),
        isActive,
        teamId: teamId || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Player</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={styles.input}
            >
              <option value="">💰 Free Agent</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.badge} {team.name}
                </option>
              ))}
            </select>
          </div>

          {player.user && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password (optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Leave empty to keep current"
                />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className={styles.checkbox}
              />
              Active Account
            </label>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.buttonSecondary}`}
              disabled={loading}
            >
              {common.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={loading}
            >
              {loading ? 'Saving...' : common.save || 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
