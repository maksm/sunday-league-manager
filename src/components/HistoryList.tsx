'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/dashboard/page.module.css';

interface Matchday {
  id: string;
  date: string;
  matches: Match[];
  season: { name: string };
}

interface Match {
  id: string;
  result: string;
}

export default function HistoryList() {
  const [history, setHistory] = useState<Matchday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matchdays/history')
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading history...</div>;

  if (history.length === 0) {
    return <div className={styles.emptyState}>No past matchdays found.</div>;
  }

  return (
    <div className={styles.section}>
      {history.map((matchday) => (
        <div
          key={matchday.id}
          style={{
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1rem',
          }}
        >
          <h3>
            {new Date(matchday.date).toLocaleDateString()} - {matchday.season?.name}
          </h3>
          {matchday.matches.map((match, idx) => (
            <div key={match.id}>
              Match {idx + 1}: <strong>{match.result || '0-0'}</strong>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
