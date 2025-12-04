'use client';

import { useState } from 'react';
import styles from './PlayerActions.module.css';
import { useTranslations } from '@/i18n/client';
import ConfirmModal from './ConfirmModal';
import EditPlayerModal from './EditPlayerModal';

type Player = {
  id: string;
  name: string;
  isActive: boolean;
  teamId?: string | null;
  user: { username: string } | null;
};

type Props = {
  player: Player;
  onUpdate: () => void;
  onDelete: () => void;
};

export default function PlayerActions({ player, onUpdate, onDelete }: Props) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const dict = useTranslations();
  const actions = (dict.admin as Record<string, unknown>).playerActions as Record<string, unknown>;

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleUpdate = async (data: {
    name: string;
    username?: string;
    password?: string;
    isActive: boolean;
    teamId?: string | null;
  }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onUpdate();
      } else {
        showError(
          ((actions.errors as Record<string, string>)?.updateFailed ||
            'Failed to update player') as string
        );
      }
    } catch {
      showError(
        ((actions.errors as Record<string, string>)?.updateError ||
          'Error updating player') as string
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    // Optimistic update or just wait? Let's wait for simplicity
    await handleUpdate({
      name: player.name,
      isActive: !player.isActive,
    });
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
      const res = await fetch(`/api/admin/players/${player.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        showError(
          data.error ||
            (((actions.errors as Record<string, string>)?.updateFailed ||
              'Failed to delete player') as string)
        );
      }
    } catch (error) {
      console.error('Error during delete:', error);
      showError(
        ((actions.errors as Record<string, string>)?.deleteError ||
          'Error deleting player') as string
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setShowEditModal(true)}
        className={`${styles.button} ${styles.buttonPrimary}`}
        disabled={loading}
      >
        {(actions.edit as string) || 'Edit'}
      </button>

      <button
        onClick={handleToggleActive}
        className={`${styles.button} ${player.isActive ? styles.buttonWarning : styles.buttonSuccess}`}
        disabled={loading}
        title={player.isActive ? 'Deactivate' : 'Activate'}
      >
        {player.isActive ? 'Deactivate' : 'Activate'}
      </button>

      <button
        onClick={handleDeleteClick}
        className={`${styles.button} ${styles.buttonDanger}`}
        disabled={loading}
        type="button"
      >
        {(actions.delete as string) || 'Delete'}
      </button>

      <EditPlayerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
        player={player}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title={(actions.delete as string) || 'Delete Player'}
        message={`Are you sure you want to PERMANENTLY delete ${player.name}? This action cannot be undone and will remove all associated data.`}
        confirmText={(actions.delete as string) || 'Delete'}
        cancelText={(actions.cancel as string) || 'Cancel'}
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
