'use client';

import { useState } from 'react';
import styles from './VotingCard.module.css';
import { useTranslations } from '@/i18n/client';

type Player = {
  id: string;
  name: string;
};

type VotingCardProps = {
  gameId: string;
  players: Player[];
};

export default function VotingCard({ gameId, players }: VotingCardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const dict = useTranslations();
  const votingCard = dict.dashboard.votingCard as Record<string, string>;

  const handleVote = async () => {
    if (!selectedPlayerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: selectedPlayerId }),
      });

      if (res.ok) {
        setVoted(true);
      }
    } catch (error) {
      console.error('Vote failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (voted) {
    return (
      <section className={styles.card}>
        <h2 className={styles.title}>{votingCard.successTitle || 'Man of the Match'}</h2>
        <p className={styles.successMessage}>{votingCard.thanks || 'Thanks for voting!'}</p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{votingCard.title || 'Vote: Man of the Match'}</h2>
      <div className={styles.form}>
        <select
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          className={styles.select}
        >
          <option value="">{votingCard.selectPlaceholder || 'Select a player...'}</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleVote}
          disabled={loading || !selectedPlayerId}
          className={styles.button}
        >
          {loading ? votingCard.submitting || 'Voting...' : votingCard.submit || 'Submit Vote'}
        </button>
      </div>
    </section>
  );
}
