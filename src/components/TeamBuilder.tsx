'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Player {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  color?: string | null;
  players: Player[];
}

interface TeamBuilderProps {
  matchdayId: string;
  initialPlayers: Player[]; // All players RSVP'd IN
  allPlayers: Player[];
  initialTeams: Team[];
}

function DraggablePlayer({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: player.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '0.5rem',
    margin: '0.25rem 0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {player.name}
    </div>
  );
}

function DroppableTeam({ team }: { team: Team }) {
  const { setNodeRef } = useSortable({ id: team.id, data: { type: 'container' } });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '1rem',
        borderRadius: '8px',
        minWidth: '200px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{team.name}</h3>
      <SortableContext items={team.players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {team.players.map((player) => (
          <DraggablePlayer key={player.id} player={player} />
        ))}
      </SortableContext>
    </div>
  );
}

export default function TeamBuilder({
  matchdayId,
  initialPlayers,
  allPlayers,
  initialTeams,
}: TeamBuilderProps) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(initialPlayers);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize available players
  useEffect(() => {
    const assignedPlayerIds = new Set(initialTeams.flatMap((t) => t.players.map((p) => p.id)));
    setAvailablePlayers(initialPlayers.filter((p) => !assignedPlayerIds.has(p.id)));
    setTeams(initialTeams);
  }, [initialPlayers, initialTeams]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string) => {
    if (availablePlayers.find((p) => p.id === id)) return 'unassigned';
    if (teams.find((t) => t.id === id)) return id;
    const team = teams.find((t) => t.players.find((p) => p.id === id));
    return team ? team.id : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string); // This might return 'unassigned' if dropped on the unassigned container

    // If dropped on the placeholder "Available" container (we need to give it an ID)
    // In the render below, the "Available" column doesn't have a droppable ID yet.
    // We should wrap it in a droppable container or just check if over.id is 'unassigned' if we make it droppable.
    // But wait, the "Available" column uses SortableContext but NOT a droppable container wrapper in the previous code?
    // Actually, the previous code had `DroppableContainer id="unassigned"` but I replaced it with a div.
    // I need to make the "Available" column droppable.

    // Let's assume overContainer is correct if we fix the render.

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      const playerId = active.id as string;
      let player: Player | undefined;

      // Remove from source
      if (activeContainer === 'unassigned') {
        player = availablePlayers.find((p) => p.id === playerId);
        // If not found in available (maybe it was from allPlayers search result but not yet in available state),
        // find it in allPlayers
        if (!player) player = allPlayers.find((p) => p.id === playerId);

        setAvailablePlayers((prev) => prev.filter((p) => p.id !== playerId));
      } else {
        const sourceTeam = teams.find((t) => t.id === activeContainer);
        if (sourceTeam) {
          player = sourceTeam.players.find((p) => p.id === playerId);
          setTeams((prev) =>
            prev.map((t) => {
              if (t.id === activeContainer) {
                return { ...t, players: t.players.filter((p) => p.id !== playerId) };
              }
              return t;
            })
          );
          await updateTeam(
            activeContainer,
            sourceTeam.players.filter((p) => p.id !== playerId).map((p) => p.id)
          );
        }
      }

      if (!player) return;

      // Add to destination
      if (overContainer === 'unassigned') {
        setAvailablePlayers((prev) => [...prev, player!]);
      } else {
        const destTeam = teams.find((t) => t.id === overContainer);
        if (destTeam) {
          const newPlayers = [...destTeam.players, player!];
          setTeams((prev) =>
            prev.map((t) => {
              if (t.id === overContainer) {
                return { ...t, players: newPlayers };
              }
              return t;
            })
          );
          await updateTeam(
            overContainer,
            newPlayers.map((p) => p.id)
          );
        }
      }
    }
  };

  const updateTeam = async (teamId: string, playerIds: string[]) => {
    try {
      await fetch(`/api/matchdays/${matchdayId}/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, playerIds }),
      });
    } catch (e) {
      console.error('Failed to persist team update', e);
    }
  };

  const createTeam = async () => {
    const name = `Team ${String.fromCharCode(65 + teams.length)}`;
    try {
      const res = await fetch(`/api/matchdays/${matchdayId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newTeam = await res.json();
        setTeams((prev) => [...prev, { ...newTeam, players: [] }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const displayedAvailablePlayers = useMemo(() => {
    const playersInTeams = new Set(teams.flatMap((t) => t.players.map((p) => p.id)));
    const currentAvailableIds = new Set(availablePlayers.map((p) => p.id));

    let results = [...availablePlayers];

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      const others = allPlayers.filter(
        (p) =>
          !currentAvailableIds.has(p.id) &&
          !playersInTeams.has(p.id) &&
          p.name.toLowerCase().includes(lowerSearch)
      );
      results = [...results, ...others];
    }

    const initialIds = new Set(initialPlayers.map((p) => p.id));
    return results.sort((a, b) => {
      const aRsvp = initialIds.has(a.id);
      const bRsvp = initialIds.has(b.id);
      if (aRsvp && !bRsvp) return -1;
      if (!aRsvp && bRsvp) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [availablePlayers, allPlayers, teams, searchTerm, initialPlayers]);

  const saveTeams = async () => {
    setIsSaving(true);
    try {
      // We can just rely on the individual updates, or implement a bulk save if needed.
      // Since we update on drag end, this button might be redundant or just a "Sync" button.
      // But let's keep it as a placebo or for bulk confirmation if we change logic.
      // For now, let's just say "Saved" since we auto-save.
      alert('Teams are auto-saved on change.');
    } catch (error) {
      console.error('Failed to save teams:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for the "Available" droppable area
  const { setNodeRef: setUnassignedNodeRef } = useSortable({
    id: 'unassigned',
    data: { type: 'container' },
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Team Builder</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={createTeam}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
              }}
            >
              + Add Team
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
          {/* Available Players Column */}
          <div
            ref={setUnassignedNodeRef}
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <h4 style={{ marginBottom: '0.5rem' }}>Available</h4>
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-color)',
              }}
            />
            <SortableContext
              items={displayedAvailablePlayers.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ minHeight: '200px' }}>
                {displayedAvailablePlayers.map((player) => (
                  <DraggablePlayer key={player.id} player={player} />
                ))}
                {displayedAvailablePlayers.length === 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#888',
                      fontSize: '0.9rem',
                    }}
                  >
                    No players found
                  </div>
                )}
              </div>
            </SortableContext>
          </div>

          {/* Teams Columns */}
          {teams.map((team) => (
            <DroppableTeam key={team.id} team={team} />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              cursor: 'grabbing',
            }}
          >
            {
              [...displayedAvailablePlayers, ...teams.flatMap((t) => t.players)].find(
                (p) => p.id === activeId
              )?.name
            }
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
