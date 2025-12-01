'use client';

import { useState } from 'react';
import styles from './SeasonActions.module.css'; // Reusing styles
import pageStyles from '../page.module.css';
import { Matchday, Season } from '@/types/api';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

type Props = {
  matchday: Matchday & { season?: { name: string } };
  seasons: Season[];
  onUpdate: () => void;
  onDelete: () => void;
};

export default function MatchdayActions({ matchday, seasons, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(matchday.date).toISOString().split('T')[0],
    time: new Date(matchday.date).toTimeString().slice(0, 5),
    seasonId: matchday.seasonId || '',
    status: matchday.status,
  });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const res = await fetch(`/api/admin/matchdays/${matchday.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateTime.toISOString(),
          seasonId: formData.seasonId || null,
          status: formData.status,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update matchday');
      }
    } catch {
      showError('Error updating matchday');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/matchdays/${matchday.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to delete matchday');
      }
    } catch {
      showError('Error deleting matchday');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsEditing(true)}
        className={`${styles.button} ${styles.buttonPrimary}`}
        disabled={loading}
      >
        Edit
      </button>
      <button
        onClick={handleDeleteClick}
        className={`${styles.button} ${styles.buttonDanger}`}
        disabled={loading}
        type="button"
      >
        Delete
      </button>

      <Modal isOpen={isEditing} title="Edit Matchday" onClose={() => setIsEditing(false)}>
        <form onSubmit={handleUpdate} className={pageStyles.form}>
          <div className={pageStyles.row}>
            <div className={pageStyles.formGroup}>
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={pageStyles.input}
                required
                disabled={loading}
              />
            </div>
            <div className={pageStyles.formGroup}>
              <label>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={pageStyles.input}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className={pageStyles.formGroup}>
            <label>Season</label>
            <select
              value={formData.seasonId}
              onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
              className={pageStyles.input}
              disabled={loading}
            >
              <option value="">No Season</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
          <div className={pageStyles.formGroup}>
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'SCHEDULED' | 'COMPLETED',
                })
              }
              className={pageStyles.input}
              disabled={loading}
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className={pageStyles.modalActions}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className={`${pageStyles.button} ${pageStyles.buttonSecondary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${pageStyles.button} ${pageStyles.buttonPrimary}`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Matchday"
        message="Are you sure you want to delete this matchday?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />

      <ConfirmModal
        isOpen={showErrorModal}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
        variant="danger"
        cancelText="Close"
      />
    </div>
  );
}
