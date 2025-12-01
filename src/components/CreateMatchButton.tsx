'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  id: string;
  name: string;
}

interface CreateMatchButtonProps {
  matchdayId: string;
  label?: string;
  teams?: Team[];
}

export default function CreateMatchButton({
  matchdayId,
  label = 'Create Match',
  teams = [],
}: CreateMatchButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const router = useRouter();

  const handleCreateMatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matchdays/${matchdayId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamAId: teamA, teamBId: teamB }),
      });

      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        console.error('Failed to create match');
      }
    } catch (error) {
      console.error('Error creating match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showModal) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: '#1a1a1a',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px',
          }}
        >
          <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Create Match</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
              Team A
            </label>
            <select
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                background: '#333',
                color: 'white',
                border: '1px solid #444',
              }}
            >
              <option value="">Select Team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
              Team B
            </label>
            <select
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                background: '#333',
                color: 'white',
                border: '1px solid #444',
              }}
            >
              <option value="">Select Team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid #444',
                color: '#ccc',
                borderRadius: '4px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMatch}
              disabled={loading || !teamA || !teamB}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                opacity: loading || !teamA || !teamB ? 0.5 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowModal(true)}
      disabled={loading}
      style={{
        padding: '0.75rem 1.5rem',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}
