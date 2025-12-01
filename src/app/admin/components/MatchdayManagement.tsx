'use client';

import { useState, useEffect, useCallback } from 'react';
import { Matchday, Season } from '@/types/api';
import styles from '../page.module.css';
import Modal from './Modal';
import MatchdayActions from './MatchdayActions';

export default function MatchdayManagement() {
  const [matchdays, setMatchdays] = useState<(Matchday & { season?: { name: string } })[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '20:00',
    seasonId: '',
  });
  const [error, setError] = useState('');

  const fetchMatchdays = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/matchdays');
      if (res.ok) {
        const data = await res.json();
        setMatchdays(data);
      }
    } catch (err) {
      console.error('Error fetching matchdays:', err);
    }
  }, []);

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seasons');
      if (res.ok) {
        const data = await res.json();
        setSeasons(data);
        // Set default season if available
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, seasonId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchMatchdays();
    fetchSeasons();
  }, [fetchMatchdays, fetchSeasons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const res = await fetch('/api/admin/matchdays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateTime.toISOString(),
          seasonId: formData.seasonId || undefined,
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setFormData((prev) => ({ ...prev, date: '' }));
        fetchMatchdays();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create matchday');
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
          <h2 className={styles.sectionTitle}>Matchdays</h2>
          <button
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonSm}`}
            onClick={() => setIsCreating(true)}
          >
            + New Matchday
          </button>
        </div>
      </div>

      <Modal isOpen={isCreating} title="Create New Matchday" onClose={() => setIsCreating(false)}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Season</label>
            <select
              value={formData.seasonId}
              onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
              className={styles.input}
            >
              <option value="">No Season</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
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
              Create Matchday
            </button>
          </div>
        </form>
      </Modal>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Season</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matchdays.map((matchday) => (
              <tr key={matchday.id}>
                <td>{new Date(matchday.date).toLocaleString()}</td>
                <td>{matchday.season?.name || '-'}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      matchday.status === 'COMPLETED' ? styles.badgeSuccess : styles.badgeWarning
                    }`}
                  >
                    {matchday.status}
                  </span>
                </td>
                <td>
                  <MatchdayActions
                    matchday={matchday}
                    seasons={seasons}
                    onUpdate={fetchMatchdays}
                    onDelete={fetchMatchdays}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
