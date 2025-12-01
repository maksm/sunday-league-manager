'use client';

import { useState } from 'react';
import styles from './SeasonActions.module.css';
import pageStyles from './page.module.css';
import { Season } from '@/types/api';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

type Props = {
  season: Season;
  onUpdate: () => void;
  onDelete: () => void;
};

export default function SeasonActions({ season, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: season.name,
    startDate: new Date(season.startDate).toISOString().split('T')[0],
    endDate: new Date(season.endDate).toISOString().split('T')[0],
    location: season.location,
    matchday: season.matchday,
    startHour: season.startHour,
    endHour: season.endHour,
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
      const res = await fetch(`/api/admin/seasons/${season.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update season');
      }
    } catch {
      showError('Error updating season');
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
      const res = await fetch(`/api/admin/seasons/${season.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to delete season');
      }
    } catch {
      showError('Error deleting season');
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

      <Modal isOpen={isEditing} title="Edit Season" onClose={() => setIsEditing(false)}>
        <form onSubmit={handleUpdate} className={pageStyles.form}>
          <div className={pageStyles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={pageStyles.input}
              placeholder="Name"
              disabled={loading}
              required
            />
          </div>
          <div className={pageStyles.row}>
            <div className={pageStyles.formGroup}>
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={pageStyles.input}
                disabled={loading}
                required
              />
            </div>
            <div className={pageStyles.formGroup}>
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={pageStyles.input}
                disabled={loading}
                required
              />
            </div>
          </div>
          <div className={pageStyles.formGroup}>
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={pageStyles.input}
              placeholder="Location"
              disabled={loading}
              required
            />
          </div>
          <div className={pageStyles.row}>
            <div className={pageStyles.formGroup}>
              <label>Matchday</label>
              <select
                value={formData.matchday}
                onChange={(e) => setFormData({ ...formData, matchday: e.target.value })}
                className={pageStyles.input}
                disabled={loading}
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
            <div className={pageStyles.formGroup}>
              <label>Start Hour</label>
              <input
                type="time"
                value={formData.startHour}
                onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                className={pageStyles.input}
                disabled={loading}
                required
              />
            </div>
            <div className={pageStyles.formGroup}>
              <label>End Hour</label>
              <input
                type="time"
                value={formData.endHour}
                onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                className={pageStyles.input}
                disabled={loading}
                required
              />
            </div>
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
        title="Delete Season"
        message={`Are you sure you want to delete "${season.name}"?`}
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
