'use client';

import { useState } from 'react';
import { UserRole } from '@/types/api';
import styles from './TeamsView.module.css';
import { useTranslations } from '@/i18n/client';

type Player = {
  id: string;
  name: string;
};

type TeamsResponse = {
  teamA: Player[];
  teamB: Player[];
  stats: {
    countA: number;
    countB: number;
  };
};

export default function TeamsView({ matchId, userRole }: { matchId: string; userRole?: UserRole }) {
  const [teams, setTeams] = useState<TeamsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [finishing, setFinishing] = useState(false);
  const dict = useTranslations();
  const teamsView = dict.dashboard.teamsView as Record<string, unknown>;
  const isAdmin = userRole === UserRole.ADMIN;

  const generateTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/balance`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Failed to generate teams', error);
    } finally {
      setLoading(false);
    }
  };

  const finishGame = async () => {
    if (!teams || !scoreA || !scoreB) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: `${scoreA}-${scoreB}`,
          teamAIds: teams.teamA.map((p) => p.id),
          teamBIds: teams.teamB.map((p) => p.id),
        }),
      });
      if (res.ok) {
        window.location.reload(); // Refresh to show updated stats/leaderboard
      }
    } catch (error) {
      console.error('Failed to finish game', error);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{(teamsView.title as string) || 'Teams'}</h2>
        {isAdmin && (
          <button onClick={generateTeams} disabled={loading} className={styles.generateButton}>
            {loading
              ? (teamsView.balancing as string) || 'Balancing...'
              : (teamsView.generateTeams as string) || 'Generate Teams'}
          </button>
        )}
      </div>

      {teams && (
        <div className={styles.teamsContainer}>
          <div className={styles.teamsGrid}>
            {/* Team A */}
            <div className={styles.teamCard}>
              <div className={styles.teamHeader}>
                <h3 className={`${styles.teamName} ${styles.teamNameA}`}>
                  {(teamsView.teamA as string) || 'Team A'}
                </h3>
              </div>
              <ul className={styles.playerList}>
                {teams.teamA.map((p) => (
                  <li key={p.id} className={styles.playerItem}>
                    <span className={styles.playerName}>{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Team B */}
            <div className={styles.teamCard}>
              <div className={styles.teamHeader}>
                <h3 className={`${styles.teamName} ${styles.teamNameB}`}>
                  {(teamsView.teamB as string) || 'Team B'}
                </h3>
              </div>
              <ul className={styles.playerList}>
                {teams.teamB.map((p) => (
                  <li key={p.id} className={styles.playerItem}>
                    <span className={styles.playerName}>{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Finish Game Section */}
          {isAdmin && (
            <div className={styles.finishSection}>
              <h3 className={styles.finishTitle}>
                {(teamsView.matchResult as string) || 'Match Result'}
              </h3>
              <div className={styles.scoreInputs}>
                <input
                  type="number"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  placeholder={
                    ((teamsView.scorePlaceholder as Record<string, string>)?.teamA || 'A') as string
                  }
                  className={styles.scoreInput}
                />
                <span className={styles.scoreDivider}>-</span>
                <input
                  type="number"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  placeholder={
                    ((teamsView.scorePlaceholder as Record<string, string>)?.teamB || 'B') as string
                  }
                  className={styles.scoreInput}
                />
                <button
                  onClick={finishGame}
                  disabled={finishing || !scoreA || !scoreB}
                  className={styles.finishButton}
                >
                  {finishing
                    ? (teamsView.saving as string) || 'Saving...'
                    : (teamsView.finishGame as string) || 'Finish Game'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
