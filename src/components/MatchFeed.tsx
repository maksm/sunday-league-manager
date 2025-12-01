'use client';

interface MatchEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  player?: { name: string } | null;
  assist?: { name: string } | null;
  team?: string | null;
}

interface MatchFeedProps {
  events: MatchEvent[];
}

export default function MatchFeed({ events }: MatchFeedProps) {
  // In a real app, use SWR or polling here. For now, just display initial.
  // Since LiveMatchReporter triggers a reload, this will update.

  return (
    <div
      style={{
        maxHeight: '300px',
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.05)',
        padding: '0.5rem',
        borderRadius: '4px',
      }}
    >
      {events.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: '#888' }}>No events yet.</p>
      ) : null}
      {events.map((event: MatchEvent) => (
        <div
          key={event.id}
          style={{
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '0.25rem',
          }}
        >
          <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
            {new Date(event.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            {event.type === 'GOAL' &&
              `⚽ Goal by ${event.player?.name || 'Unknown'} (${event.team})`}
            {event.type === 'GOAL' && event.assist && ` (ast. ${event.assist.name})`}
            {event.type === 'START' && '🏁 Match Started'}
            {event.type === 'END' && '🛑 Match Ended'}
          </span>
        </div>
      ))}
    </div>
  );
}
