'use client';

import { useState, useEffect, useCallback } from 'react';
import { Season, CreateSeasonRequest } from '@/types/api';
import styles from './page.module.css';
import SeasonActions from './SeasonActions';
import Modal from './Modal';

export default function SeasonManagement() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateSeasonRequest>({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    matchday: 'FRIDAY',
    startHour: '20:00',
    endHour: '21:30',
  });
  const [error, setError] = useState('');

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seasons');
      if (res.ok) {
        const data = await res.json();
        setSeasons(data);
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchSeasons();
  }, [fetchSeasons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsCreating(false);
        setFormData({
          name: '',
          startDate: '',
          endDate: '',
          location: '',
          matchday: 'FRIDAY',
          startHour: '20:00',
          endHour: '21:30',
        });
        fetchSeasons();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create season');
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
          <h2 className={styles.sectionTitle}>Seasons</h2>
          <button
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonSm}`}
            onClick={() => setIsCreating(true)}
          >
            + New Season
          </button>
        </div>
      </div>

      <Modal isOpen={isCreating} title="Create New Season" onClose={() => setIsCreating(false)}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={styles.input}
              placeholder="e.g. Winter 2024"
            />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className={styles.input}
              placeholder="e.g. Sports Hall Center"
            />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Matchday</label>
              <select
                value={formData.matchday}
                onChange={(e) => setFormData({ ...formData, matchday: e.target.value })}
                className={styles.input}
              >
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
                <option value="FRIDAY">Friday</option>
                <option value="SATURDAY">Saturday</option>
                <option value="SUNDAY">Sunday</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Start Hour</label>
              <input
                type="time"
                value={formData.startHour}
                onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>End Hour</label>
              <input
                type="time"
                value={formData.endHour}
                onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                required
                className={styles.input}
              />
            </div>
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
              Create Season
            </button>
          </div>
        </form>
      </Modal>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Dates</th>
              <th>Time</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr key={season.id}>
                <td>{season.name}</td>
                <td>
                  {new Date(season.startDate).toLocaleDateString()} -{' '}
                  {new Date(season.endDate).toLocaleDateString()}
                </td>
                <td>
                  {season.matchday} {season.startHour}-{season.endHour}
                </td>
                <td>{season.location}</td>
                <td>
                  <SeasonActions season={season} onUpdate={fetchSeasons} onDelete={fetchSeasons} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
