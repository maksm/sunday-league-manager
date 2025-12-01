'use client';

import { useState } from 'react';

interface Player {
  id: string;
  name: string;
}

interface LiveMatchReporterProps {
  matchId: string;
  players: Player[];
}

export default function LiveMatchReporter({ matchId, players }: LiveMatchReporterProps) {
  const [reporting, setReporting] = useState<string | null>(null); // 'GOAL', 'SUB'
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedAssist, setSelectedAssist] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('A');

  const handleReport = async (type: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data }),
      });
      if (res.ok) {
        setReporting(null);
        setSelectedPlayer('');
        setSelectedAssist('');
        // Ideally trigger a refresh or update context
        window.location.reload(); // Simple refresh for now
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (reporting === 'GOAL') {
    return (
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
        <h4>Report Goal</h4>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Team: </label>
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="A">Team A</option>
            <option value="B">Team B</option>
          </select>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Scorer: </label>
          <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
            <option value="">Select Player</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Assist (Optional): </label>
          <select value={selectedAssist} onChange={(e) => setSelectedAssist(e.target.value)}>
            <option value="">None</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() =>
            handleReport('GOAL', {
              playerId: selectedPlayer,
              assistId: selectedAssist || undefined,
              team: selectedTeam,
            })
          }
        >
          Submit
        </button>
        <button onClick={() => setReporting(null)} style={{ marginLeft: '0.5rem' }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <button onClick={() => handleReport('START', {})}>Start Match</button>
      <button onClick={() => setReporting('GOAL')}>Goal</button>
      <button onClick={() => handleReport('END', {})}>End Match</button>
    </div>
  );
}
