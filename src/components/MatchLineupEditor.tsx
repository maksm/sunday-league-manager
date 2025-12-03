'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  name: string;
}

interface MatchStat {
  id: string;
  playerId: string;
  team: string; // 'A' or 'B'
}

interface MatchLineupEditorProps {
  matchId: string;
  initialStats: MatchStat[];
  allPlayers: Player[];
}

export default function MatchLineupEditor({
  matchId,
  initialStats,
  allPlayers,
}: MatchLineupEditorProps) {
  const [stats] = useState<MatchStat[]>(initialStats);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const teamAPlayers = stats
    .filter((s) => s.team === 'A')
    .map((s) => {
      const player = allPlayers.find((p) => p.id === s.playerId);
      return { ...s, name: player?.name || 'Unknown' };
    });

  const teamBPlayers = stats
    .filter((s) => s.team === 'B')
    .map((s) => {
      const player = allPlayers.find((p) => p.id === s.playerId);
      return { ...s, name: player?.name || 'Unknown' };
    });

  const unassignedPlayers = allPlayers.filter((p) => !stats.find((s) => s.playerId === p.id));

  const handleAction = async (
    action: 'ADD' | 'REMOVE' | 'SWITCH',
    playerId: string,
    team?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, playerId, team }),
      });

      if (res.ok) {
        router.refresh();
        // Optimistic update could be done here, but refresh is safer for now
      }
    } catch (error) {
      console.error('Error updating lineup:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          fontSize: '0.8rem',
          background: 'transparent',
          border: '1px solid #444',
          color: '#888',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          marginTop: '0.5rem',
        }}
      >
        Edit Lineup
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h4>Lineup Editor</h4>
        <button
          onClick={() => setIsExpanded(false)}
          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h5 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Team A</h5>
          {teamAPlayers.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem',
                fontSize: '0.9rem',
              }}
            >
              <span>{p.name}</span>
              <div>
                <button
                  onClick={() => handleAction('SWITCH', p.playerId)}
                  disabled={loading}
                  style={{ marginRight: '0.25rem', fontSize: '0.7rem' }}
                >
                  ⇄
                </button>
                <button
                  onClick={() => handleAction('REMOVE', p.playerId)}
                  disabled={loading}
                  style={{ color: 'red', fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '0.5rem' }}>
            <select
              onChange={(e) => {
                if (e.target.value) handleAction('ADD', e.target.value, 'A');
              }}
              value=""
              style={{
                width: '100%',
                fontSize: '0.8rem',
                padding: '0.25rem',
                background: '#333',
                color: 'white',
                border: 'none',
              }}
            >
              <option value="">+ Add to Team A</option>
              {unassignedPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h5 style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }}>Team B</h5>
          {teamBPlayers.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.25rem',
                fontSize: '0.9rem',
              }}
            >
              <span>{p.name}</span>
              <div>
                <button
                  onClick={() => handleAction('SWITCH', p.playerId)}
                  disabled={loading}
                  style={{ marginRight: '0.25rem', fontSize: '0.7rem' }}
                >
                  ⇄
                </button>
                <button
                  onClick={() => handleAction('REMOVE', p.playerId)}
                  disabled={loading}
                  style={{ color: 'red', fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '0.5rem' }}>
            <select
              onChange={(e) => {
                if (e.target.value) handleAction('ADD', e.target.value, 'B');
              }}
              value=""
              style={{
                width: '100%',
                fontSize: '0.8rem',
                padding: '0.25rem',
                background: '#333',
                color: 'white',
                border: 'none',
              }}
            >
              <option value="">+ Add to Team B</option>
              {unassignedPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
