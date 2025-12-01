'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CreateShadowPlayerForm.module.css';
import { useTranslations } from '@/i18n/client';
import ConfirmModal from './ConfirmModal';

type Props = {
  onSuccess?: () => void;
};

export default function CreateShadowPlayerForm({ onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const dict = useTranslations();
  const form = (dict.admin as Record<string, Record<string, unknown>>).createShadowPlayer as Record<
    string,
    unknown
  >;

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setName('');
        onSuccess?.();
        router.refresh();
      } else {
        showError(
          ((form.errors as Record<string, string>)?.createFailed ||
            'Failed to create player') as string
        );
      }
    } catch (error) {
      console.error(error);
      showError(
        ((form.errors as Record<string, string>)?.createError || 'Error creating player') as string
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={(form.placeholder as string) || 'Player Name'}
          className={styles.input}
          required
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading
            ? (form.submitting as string) || 'Creating...'
            : (form.submit as string) || 'Create Player'}
        </button>
      </form>

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
    </>
  );
}
