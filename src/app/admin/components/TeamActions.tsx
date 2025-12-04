'use client';

import { useState } from 'react';
import styles from './SeasonActions.module.css';
import pageStyles from '../page.module.css';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

type Team = {
  id: string;
  name: string;
  badge: string | null;
  _count: {
    players: number;
  };
};

type Props = {
  team: Team;
  onUpdate: () => void;
  onDelete: () => void;
};

export default function TeamActions({ team, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    badge: team.badge || '',
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
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          badge: formData.badge || null,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to update team');
      }
    } catch {
      showError('Error updating team');
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
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        showError(data.error || 'Failed to delete team');
      }
    } catch {
      showError('Error deleting team');
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

      <Modal isOpen={isEditing} title="Edit Team" onClose={() => setIsEditing(false)}>
        <form onSubmit={handleUpdate} className={pageStyles.form}>
          <div className={pageStyles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={pageStyles.input}
              placeholder="Team name"
              disabled={loading}
              required
            />
          </div>
          <div className={pageStyles.formGroup}>
            <label>Badge (emoji or URL)</label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className={pageStyles.input}
              placeholder="e.g. or https://..."
              disabled={loading}
            />
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
        title="Delete Team"
        message={`Are you sure you want to delete "${team.name}"?${team._count.players > 0 ? ` This will remove team association from ${team._count.players} player(s).` : ''}`}
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
