'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import TeamActions from './TeamActions';
import Modal from './Modal';

type Team = {
  id: string;
  name: string;
  badge: string | null;
  _count: {
    players: number;
  };
};

type CreateTeamRequest = {
  name: string;
  badge: string;
};

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    badge: '',
  });
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/admin/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };
    fetchTeams();
  }, [refreshKey]);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          badge: formData.badge || undefined,
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setFormData({
          name: '',
          badge: '',
        });
        triggerRefresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create team');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleWithAction}>
          <h2 className={styles.sectionTitle}>Teams</h2>
          <button
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonSm}`}
            onClick={() => setIsCreating(true)}
          >
            + New Team
          </button>
        </div>
      </div>

      <Modal isOpen={isCreating} title="Create New Team" onClose={() => setIsCreating(false)}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={styles.input}
              placeholder="e.g. FC United"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Badge (emoji or URL)</label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className={styles.input}
              placeholder="e.g. or https://..."
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
              Create Team
            </button>
          </div>
        </form>
      </Modal>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Badge</th>
              <th>Name</th>
              <th>Players</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td style={{ fontSize: '1.5rem', textAlign: 'center', width: '60px' }}>
                  {team.badge || '-'}
                </td>
                <td>{team.name}</td>
                <td>{team._count.players}</td>
                <td>
                  <TeamActions team={team} onUpdate={triggerRefresh} onDelete={triggerRefresh} />
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', opacity: 0.6 }}>
                  No teams created yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
